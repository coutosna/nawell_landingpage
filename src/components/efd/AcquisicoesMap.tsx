import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface AcquisicoesMapProps {
  efdTxt?: string;
  origin?: { codMun: string; name: string; uf: string };
  height?: number;
}

function parseEFDForAquisicoes(txt = "") {
  const lines = String(txt).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const participantes = new Map();
  const notas = [];
  const itens = [];

  for (const raw of lines) {
    if (!raw.startsWith("|")) continue;
    const cols = raw.split("|");
    const reg = cols[1];

    // Bloco 0150 - Participantes (Fornecedores)
    if (reg === "0150") {
      const codPart = cols[2] || "";
      const nome = cols[3] || "";
      let codMun = "";
      let uf = "";
      
      // Busca UF
      for (let i = 4; i < cols.length; i++) {
        if (cols[i] && cols[i].length === 2 && /^[A-Z]{2}$/.test(cols[i])) {
          uf = cols[i];
          break;
        }
      }
      
      // Busca código do município (7 dígitos IBGE)
      for (const c of cols) {
        if (/^\d{7}$/.test(c)) { 
          codMun = c; 
          break; 
        }
      }
      
      participantes.set(codPart, { nome, codMun, uf });
    }

    // Bloco C100 - Cabeçalho NF com IND_OPER = 0 (Entradas)
    if (reg === "C100") {
      const indOper = cols[2] || "";
      if (indOper !== "0") continue; // Apenas entradas
      
      const codPart = cols[4] || "";
      const codSit = cols[5] || "00";
      const nr = cols[8] || "";
      const chave = cols[9] || "";
      const dt = cols[10] || "";
      const vlDoc = parseFloat((cols[14] || "0").replace(",", ".")) || 0;
      
      // Filtra documentos cancelados/inutilizados
      if (codSit !== "00") continue;
      
      notas.push({ nr, codPart, chave, dt, vlDoc, docId: `${nr}_${dt}_${codPart}` });
    }

    // Bloco C170 - Itens da NF de Entrada
    if (reg === "C170") {
      const last = notas[notas.length - 1];
      if (!last) continue;
      
      const nrNF = last.nr;
      const docId = last.docId;
      
      // CFOP de entrada (1xxx, 2xxx, 3xxx)
      const cfop = (cols.find(c => /^[1-3]\d{3}$/.test(c)) || "");
      if (!cfop) continue;
      
      const vlItem = parseFloat((cols[7] || "0").replace(",", ".")) || 0;
      const codItem = cols[3] || "";
      const descr = cols[4] || "";
      const codPart = last.codPart;
      const dt = last.dt;
      
      itens.push({ nrNF, cfop, vlItem, codItem, descr, codPart, docId, dt });
    }
  }

  return { participantes, notas, itens };
}

async function fetchMunicipiosGeoJSON() {
  const url = "https://servicodados.ibge.gov.br/api/v4/malhas/paises/BR?intrarregiao=municipio&formato=application/vnd.geo+json";
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`IBGE malha retornou ${resp.status}`);
  return resp.json();
}

function featureCentroidApprox(f: any) {
  try {
    if (!f?.geometry) return null;
    const coords = f.geometry.coordinates;
    const flat: number[][] = [];
    const collect = (arr: any) => {
      if (!arr) return;
      if (typeof arr[0] === 'number') { flat.push(arr); return; }
      for (const a of arr) collect(a);
    };
    collect(coords);
    if (!flat.length) return null;
    let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
    for (const [x, y] of flat) {
      if (x < minx) minx = x; if (y < miny) miny = y;
      if (x > maxx) maxx = x; if (y > maxy) maxy = y;
    }
    return [(minx + maxx) / 2, (miny + maxy) / 2];
  } catch (e) { return null; }
}

function buildCentroidIndex(geojson: any) {
  const idx = new Map();
  if (!geojson?.features) return idx;
  for (const f of geojson.features) {
    const props = f.properties || {};
    const code = String(f.id ?? props?.id ?? props?.codigo ?? props?.CD_MUN ?? "");
    if (!/^\d{7}$/.test(code)) continue;
    const c = featureCentroidApprox(f);
    if (c) idx.set(code, c);
  }
  return idx;
}

export default function AcquisicoesMap({ 
  efdTxt = "", 
  origin, 
  height = 640 
}: AcquisicoesMapProps) {
  const { participantes, itens } = useMemo(() => parseEFDForAquisicoes(efdTxt), [efdTxt]);
  const [geojson, setGeojson] = useState<any>(null);
  const [estadosGeojson, setEstadosGeojson] = useState<any>(null);
  const [centroidIndex, setCentroidIndex] = useState(new Map());
  const [loadingGJ, setLoadingGJ] = useState(false);
  const [errGJ, setErrGJ] = useState("");
  const [viewMode, setViewMode] = useState<'municipios' | 'estados'>('municipios');

  const origem = useMemo(() => {
    if (origin?.codMun) return origin;
    return { codMun: "3550308", name: "Empresa (não identificada)", uf: "SP" };
  }, [origin]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingGJ(true);
        const [gjMunicipios, gjEstados] = await Promise.all([
          fetchMunicipiosGeoJSON(),
          fetch('https://servicodados.ibge.gov.br/api/v4/malhas/paises/BR?intrarregiao=UF&formato=application/vnd.geo+json').then(r => r.json())
        ]);
        if (cancelled) return;
        setGeojson(gjMunicipios);
        setEstadosGeojson(gjEstados);
        const idx = buildCentroidIndex(gjMunicipios);
        if (!cancelled) setCentroidIndex(idx);
      } catch (e: any) {
        setErrGJ(String(e?.message || e));
      } finally { if (!cancelled) setLoadingGJ(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  // Agrupa aquisições por fornecedor e município
  const fornecedores = useMemo(() => {
    const acc = new Map();
    const docsProcessados = new Set();
    
    for (const it of itens) {
      // Evita duplicar valores por documento
      if (!docsProcessados.has(it.docId)) {
        docsProcessados.add(it.docId);
      }
      
      const part = participantes.get(it.codPart);
      if (!part) continue;
      
      let codMun = part.codMun;
      
      // Se não tem codMun mas tem UF, tenta derivar
      if (!codMun && part.uf) {
        const ufCodes: Record<string, string> = {
          'RO': '11', 'AC': '12', 'AM': '13', 'RR': '14', 'PA': '15', 'AP': '16', 'TO': '17',
          'MA': '21', 'PI': '22', 'CE': '23', 'RN': '24', 'PB': '25', 'PE': '26', 'AL': '27', 'SE': '28', 'BA': '29',
          'MG': '31', 'ES': '32', 'RJ': '33', 'SP': '35',
          'PR': '41', 'SC': '42', 'RS': '43',
          'MS': '50', 'MT': '51', 'GO': '52', 'DF': '53'
        };
        const ufCode = ufCodes[part.uf];
        if (ufCode) codMun = ufCode + '00000'; // Código genérico da capital
      }
      
      if (!/^\d{7}$/.test(codMun)) continue;
      
      const key = `${it.codPart}|${codMun}`;
      const cur = acc.get(key) || { 
        codPart: it.codPart,
        fornecedor: part.nome, 
        codMun, 
        uf: part.uf || codMun.substring(0, 2),
        total: 0, 
        items: [],
        countNF: new Set()
      };
      
      cur.total += it.vlItem || 0;
      cur.items.push(it);
      cur.countNF.add(it.docId);
      acc.set(key, cur);
    }
    
    return Array.from(acc.values())
      .map(f => ({ ...f, countNF: f.countNF.size }))
      .sort((a: any, b: any) => b.total - a.total);
  }, [itens, participantes]);

  // Agrupa aquisições por estado
  const aquisicoesPorEstado = useMemo(() => {
    const estadosMap = new Map<string, { uf: string; total: number; fornecedores: Set<string>; itens: number }>();
    
    fornecedores.forEach((f: any) => {
      const codUF = f.codMun.substring(0, 2);
      const ufMap: Record<string, string> = {
        '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO',
        '21': 'MA', '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE', '29': 'BA',
        '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
        '41': 'PR', '42': 'SC', '43': 'RS',
        '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF'
      };
      
      const uf = f.uf || ufMap[codUF] || 'XX';
      const current = estadosMap.get(uf) || { uf, total: 0, fornecedores: new Set(), itens: 0 };
      current.total += f.total;
      current.fornecedores.add(f.codPart);
      current.itens += f.items?.length || 0;
      estadosMap.set(uf, current);
    });
    
    return Array.from(estadosMap.values())
      .sort((a, b) => b.total - a.total)
      .map(e => ({ ...e, fornecedores: e.fornecedores.size }));
  }, [fornecedores]);

  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [expandedEstados, setExpandedEstados] = useState(false);
  const [selectedEstado, setSelectedEstado] = useState<string | null>(null);

  useEffect(() => {
    if (!mapNode.current || mapRef.current) return;
    
    const map = L.map(mapNode.current).setView([-15.7801, -47.9292], 4);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);
    
    mapRef.current = map;
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    
    // Limpa layers anteriores
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.GeoJSON) {
        map.removeLayer(layer);
      }
    });
    
    // Limpa controles de legenda anteriores
    map.eachLayer((layer) => {
      if ((layer as any)._container?.classList?.contains('legend')) {
        map.removeLayer(layer);
      }
    });
    
    // SEMPRE pinta os estados no fundo baseado nas aquisições
    if (estadosGeojson && aquisicoesPorEstado.length > 0) {
      const maxValor = Math.max(...aquisicoesPorEstado.map(e => e.total), 1);
      const aquisicoesPorUF = new Map(aquisicoesPorEstado.map(e => [e.uf, e]));
      
      const getColor = (valor: number) => {
        const intensity = Math.min(valor / maxValor, 1);
        if (intensity > 0.7) return '#0D2B28';
        if (intensity > 0.5) return '#14403B';
        if (intensity > 0.3) return '#3D6259';
        if (intensity > 0.1) return '#8AAAA5';
        return '#D7E2E0';
      };
      
      let selectedLayer: any = null;
      
      estadosGeojson.features.forEach((feature: any) => {
        const sigla = feature.properties?.sigla || feature.properties?.SIGLA || '';
        const aquisicoes = aquisicoesPorUF.get(sigla);
        
        const layer = L.geoJSON(feature, {
          style: {
            fillColor: aquisicoes ? getColor(aquisicoes.total) : '#EDF2F1',
            weight: selectedEstado === sigla ? 3 : 1,
            opacity: 1,
            color: selectedEstado === sigla ? '#333' : 'white',
            fillOpacity: aquisicoes ? (selectedEstado === sigla ? 0.9 : 0.6) : 0.2
          },
          onEachFeature: (feat, lyr) => {
            if (!aquisicoes) return;
            
            lyr.on({
              mouseover: (e) => {
                const layer = e.target;
                layer.setStyle({
                  weight: 2,
                  color: '#333',
                  fillOpacity: 0.8
                });
              },
              mouseout: (e) => {
                const layer = e.target;
                layer.setStyle({
                  weight: selectedEstado === sigla ? 3 : 1,
                  color: selectedEstado === sigla ? '#333' : 'white',
                  fillOpacity: selectedEstado === sigla ? 0.9 : 0.6
                });
              },
              click: () => {
                setSelectedEstado(sigla);
              }
            });
            
            lyr.bindPopup(`
              <div style="font-size:14px; min-width: 220px;">
                <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">
                  ${feat.properties?.nome || feat.properties?.NOME || sigla}
                </div>
                <div style="padding: 8px 0; border-top: 1px solid #D7E2E0;">
                  <div style="font-weight: bold; font-size: 18px; color: #0D2B28; margin-bottom: 4px;">
                    R$ ${aquisicoes.total.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}
                  </div>
                  <div style="font-size: 12px; color: #666; margin-top: 4px;">
                    🏭 ${aquisicoes.fornecedores} ${aquisicoes.fornecedores === 1 ? 'fornecedor' : 'fornecedores'}
                  </div>
                  <div style="font-size: 12px; color: #666;">
                    📦 ${aquisicoes.itens} ${aquisicoes.itens === 1 ? 'item adquirido' : 'itens adquiridos'}
                  </div>
                </div>
              </div>
            `);
            
            // Se este é o estado selecionado, guarda a referência
            if (selectedEstado === sigla) {
              selectedLayer = lyr;
            }
          }
        });
        
        layer.addTo(map);
      });
      
      // Se há um estado selecionado, foca nele e abre o popup
      if (selectedLayer && selectedEstado) {
        const bounds = selectedLayer.getBounds();
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 7 });
        setTimeout(() => {
          selectedLayer.openPopup();
        }, 300);
      } else if (!selectedEstado) {
        // Mantém visualização Brasil apenas se não há estado selecionado
        map.setView([-14.235, -51.9253], 4);
      }
      
      // Adiciona legenda
      const legend = L.control({ position: 'bottomright' });
      legend.onAdd = () => {
        const div = L.DomUtil.create('div', 'info legend');
        div.style.background = 'white';
        div.style.padding = '10px';
        div.style.borderRadius = '8px';
        div.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        
        const colors = ['#D7E2E0', '#8AAAA5', '#3D6259', '#14403B', '#0D2B28'];
        const grades = [0, 0.1, 0.3, 0.5, 0.7, 1];
        
        div.innerHTML = '<div style="font-weight: bold; margin-bottom: 8px; font-size: 12px;">Volume de Aquisições</div>';
        
        for (let i = 0; i < colors.length; i++) {
          if (grades[i] === 0 && maxValor > 0) continue;
          const minVal = (grades[i] * maxValor).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
          const maxVal = (grades[i + 1] * maxValor).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
          div.innerHTML += `
            <div style="margin: 4px 0; display: flex; align-items: center; font-size: 11px;">
              <span style="display: inline-block; width: 20px; height: 14px; background: ${colors[i]}; margin-right: 6px; border-radius: 2px;"></span>
              ${grades[i] === 0 ? 'Sem aquisições' : `R$ ${minVal} - ${maxVal}`}
            </div>
          `;
        }
        
        return div;
      };
      legend.addTo(map);
    }
    
    if (viewMode === 'estados' && estadosGeojson) {
      // Modo choropleth por estado - já renderizado acima, apenas retorna
      return;
    } else {
      // Modo heatmap por município
      const bounds: L.LatLngBoundsExpression = [];
      
      const getMunicipioNome = (codMun: string): string => {
        if (!geojson?.features) return '';
        const feature = geojson.features.find((f: any) => {
          const props = f.properties || {};
          const code = String(f.id ?? props?.id ?? props?.codigo ?? props?.CD_MUN ?? "");
          return code === codMun;
        });
        return feature?.properties?.name || feature?.properties?.nome || feature?.properties?.NM_MUN || '';
      };
      
      // Marca origem (empresa)
      const oriCoords = centroidIndex.get(origem.codMun);
      if (oriCoords) {
        const [olng, olat] = oriCoords as number[];
        bounds.push([olat, olng]);
        
        const oriMarker = L.marker([olat, olng], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: `<div style="background: #89A9A4; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🏢</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        });
        
        oriMarker.bindPopup(`
          <div style="font-size:14px; font-weight: bold;">
            <div style="color: #89A9A4;">🏢 SUA EMPRESA</div>
            <div style="margin-top: 4px;">${origem.name}</div>
            <div style="font-size: 12px; color: #666; margin-top: 2px;">IBGE: ${origem.codMun}</div>
          </div>
        `);
        
        oriMarker.addTo(map);
      }
      
      // Marca fornecedores
      fornecedores.forEach((f: any) => {
        const coords = centroidIndex.get(f.codMun);
        if (!coords) return;
        
        const [lng, lat] = coords as number[];
        bounds.push([lat, lng]);
        
        const munNome = getMunicipioNome(f.codMun);
        const size = Math.min(Math.max(Math.log(f.total) * 3, 12), 40);
        
        const marker = L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: `<div style="background: #0D2B28; color: white; border-radius: 50%; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); font-size: ${Math.max(size/3, 10)}px;">🏭</div>`,
            iconSize: [size, size],
            iconAnchor: [size/2, size/2]
          })
        });
        
        marker.bindPopup(`
          <div style="font-size:13px; min-width: 240px;">
            <div style="font-weight: bold; font-size: 15px; margin-bottom: 6px; color: #0D2B28;">
              🏭 ${f.fornecedor || 'Fornecedor'}
            </div>
            <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
              📍 ${munNome} - ${f.uf}
              <div style="color: #999; margin-top: 2px;">IBGE: ${f.codMun}</div>
            </div>
            <div style="border-top: 1px solid #D7E2E0; padding-top: 8px;">
              <div style="font-weight: bold; font-size: 16px; color: #0D2B28; margin-bottom: 4px;">
                R$ ${f.total.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}
              </div>
              <div style="font-size: 11px; color: #666;">
                📄 ${f.countNF} ${f.countNF === 1 ? 'nota fiscal' : 'notas fiscais'}
              </div>
              <div style="font-size: 11px; color: #666;">
                📦 ${f.items.length} ${f.items.length === 1 ? 'item' : 'itens'}
              </div>
            </div>
          </div>
        `);
        
        marker.addTo(map);
      });
      
      // Mantém visualização Brasil se não há estado selecionado ou bounds vazios
      if (!selectedEstado) {
        map.setView([-14.235, -51.9253], 4);
      }
    }
  }, [viewMode, fornecedores, aquisicoesPorEstado, centroidIndex, geojson, estadosGeojson, origem, selectedEstado]);

  const totalAquisicoes = fornecedores.reduce((sum: number, f: any) => sum + f.total, 0);
  const totalFornecedores = fornecedores.length;
  const totalNFs = fornecedores.reduce((sum: number, f: any) => sum + f.countNF, 0);
  const top5Fornecedores = fornecedores.slice(0, 5);

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mapa de Aquisições</h2>
          <p className="text-muted-foreground">Origem geográfica dos fornecedores (entradas)</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('municipios')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'municipios' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Por Município
          </button>
          <button
            onClick={() => setViewMode('estados')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'estados' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Por Estado
          </button>
        </div>
      </div>

      {loadingGJ && (
        <div className="text-center py-8 text-muted-foreground">
          Carregando dados geográficos...
        </div>
      )}
      
      {errGJ && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md">
          Erro ao carregar mapa: {errGJ}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <div 
            ref={mapNode} 
            style={{ height: `${height}px` }} 
            className="rounded-lg border shadow-sm relative"
          >
            {/* Painel de resumo do estado selecionado */}
            {selectedEstado && aquisicoesPorEstado.find((e: any) => e.uf === selectedEstado) && (
              <div className="absolute bottom-4 right-4 z-[1000] animate-fade-in">
                <div className="bg-card border-2 border-primary rounded-lg shadow-2xl p-4 min-w-[280px]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-3xl font-bold text-primary">
                      {selectedEstado}
                    </h3>
                    <button
                      onClick={() => setSelectedEstado(null)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Fechar"
                    >
                      ✕
                    </button>
                  </div>
                  
                  {(() => {
                    const estado = aquisicoesPorEstado.find((e: any) => e.uf === selectedEstado);
                    return estado ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>🏭</span>
                          <span>{estado.fornecedores} fornecedores</span>
                        </div>
                        
                        <div className="text-2xl font-bold text-efd-primary">
                          R$ {estado.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>📦</span>
                          <span>{estado.itens} itens</span>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-card rounded-lg border shadow-sm">
            <h3 className="font-semibold text-sm mb-3">Resumo de Aquisições</h3>
            <div className="space-y-2 text-sm">
              <div>
                <div className="text-muted-foreground">Total Adquirido</div>
                <div className="font-bold text-lg text-primary">
                  R$ {totalAquisicoes.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Fornecedores</div>
                <div className="font-semibold">{totalFornecedores}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Notas Fiscais</div>
                <div className="font-semibold">{totalNFs}</div>
              </div>
            </div>
          </div>

          {top5Fornecedores.length > 0 && (
            <div className="p-4 bg-card rounded-lg border shadow-sm">
              <h3 className="font-semibold text-sm mb-3">Top 5 Fornecedores</h3>
              <div className="space-y-2">
                {top5Fornecedores.map((f: any, i: number) => (
                  <div key={i} className="text-xs">
                    <div className="font-medium truncate" title={f.fornecedor}>
                      {f.fornecedor || 'Sem nome'}
                    </div>
                    <div className="text-primary font-semibold">
                      R$ {f.total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </div>
                    <div className="text-muted-foreground">
                      {f.uf} • {f.countNF} NF{f.countNF !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {aquisicoesPorEstado.length > 0 && (
            <div className="p-4 bg-card rounded-lg border shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Por Estado</h3>
                {aquisicoesPorEstado.length > 5 && (
                  <button
                    onClick={() => setExpandedEstados(!expandedEstados)}
                    className="text-xs text-primary hover:underline"
                  >
                    {expandedEstados ? 'Ver menos' : `+${aquisicoesPorEstado.length - 5} estados`}
                  </button>
                )}
              </div>
              <div className={`space-y-2 text-xs ${!expandedEstados && 'max-h-[300px]'} overflow-y-auto`}>
                {(expandedEstados ? aquisicoesPorEstado : aquisicoesPorEstado.slice(0, 5)).map((e: any) => (
                  <div 
                    key={e.uf} 
                    className={`flex justify-between items-start p-2 rounded hover:bg-muted/50 transition-colors cursor-pointer ${
                      selectedEstado === e.uf ? 'ring-2 ring-primary bg-muted/50' : ''
                    }`}
                    onClick={() => {
                      setSelectedEstado(e.uf);
                      setViewMode('estados');
                    }}
                  >
                    <div>
                      <div className="font-bold text-lg text-primary">{e.uf}</div>
                      <div className="text-muted-foreground mt-1">
                        {e.fornecedores} fornec. • {e.itens} itens
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-primary">
                        R$ {e.total.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
