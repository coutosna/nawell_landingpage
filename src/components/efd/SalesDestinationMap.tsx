import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface SalesDestinationMapProps {
  efdTxt?: string;
  origin?: { codMun: string; name: string; uf: string };
  height?: number;
}

function parseEFDForMap(txt = "") {
  const lines = String(txt).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const participantes = new Map();
  const estabelecimentos = [];
  const notas = [];
  const itens = [];

  for (const raw of lines) {
    if (!raw.startsWith("|")) continue;
    const cols = raw.split("|");
    const reg = cols[1];

    if (reg === "0150") {
      const codPart = cols[2] || "";
      const nome = cols[3] || "";
      let codMun = "";
      for (const c of cols) if (/^\d{7}$/.test(c)) { codMun = c; break; }
      participantes.set(codPart, { nome, codMun });
    }

    if (reg === "0140") {
      const codEstab = cols[2] || "";
      const nome = cols[3] || "";
      const uf = cols[5] || "";
      let codMun = "";
      for (const c of cols) if (/^\d{7}$/.test(c)) { codMun = c; break; }
      estabelecimentos.push({ codEstab, nome, uf, codMun });
    }

    if (reg === "C100") {
      const codPart = cols[4] || "";
      const nr = cols[8] || "";
      const chave = cols[9] || "";
      const dt = cols[10] || "";
      notas.push({ nr, codPart, chave, dt });
    }

    if (reg === "C170") {
      const last = notas[notas.length - 1];
      const nrNF = last?.nr || "";
      const cfop = (cols.find(c => /^(5|6|7)\d{3}$/.test(c)) || "");
      const vlItem = parseFloat((cols[7] || "0").replace(",", ".")) || 0;
      const codItem = cols[3] || "";
      const descr = cols[4] || "";
      const codPart = last?.codPart || "";
      itens.push({ nrNF, cfop, vlItem, codItem, descr, codPart });
    }
  }

  return { participantes, estabelecimentos, notas, itens };
}

async function fetchEstadosGeoJSON() {
  const url = 'https://servicodados.ibge.gov.br/api/v4/malhas/paises/BR?intrarregiao=UF&formato=application/vnd.geo+json';
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`IBGE malha retornou ${resp.status}`);
  return resp.json();
}

export default function SalesDestinationMap({ 
  efdTxt = "", 
  origin, 
  height = 640 
}: SalesDestinationMapProps) {
  const { participantes, estabelecimentos, itens } = useMemo(() => parseEFDForMap(efdTxt), [efdTxt]);
  const [estadosGeojson, setEstadosGeojson] = useState<any>(null);
  const [loadingGJ, setLoadingGJ] = useState(false);
  const [errGJ, setErrGJ] = useState("");
  const [selectedEstado, setSelectedEstado] = useState<string | null>(null);

  const origem = useMemo(() => {
    if (origin?.codMun) return origin;
    const first = estabelecimentos[0];
    if (first) return { codMun: first.codMun, name: first.nome, uf: first.uf };
    return { codMun: "3550308", name: "Origem (não identificada)", uf: "SP" };
  }, [origin, estabelecimentos]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingGJ(true);
        const gjEstados = await fetchEstadosGeoJSON();
        if (cancelled) return;
        setEstadosGeojson(gjEstados);
      } catch (e: any) {
        setErrGJ(String(e?.message || e));
      } finally { if (!cancelled) setLoadingGJ(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  // Agrupa vendas por estado
  const vendasPorEstado = useMemo(() => {
    const estadosMap = new Map<string, { uf: string; total: number; municipios: Set<string>; itens: number }>();
    
    itens.forEach((item) => {
      const part = participantes.get(item.codPart);
      if (!part || !part.codMun || !/^\d{7}$/.test(part.codMun)) return;
      
      const codUF = part.codMun.substring(0, 2);
      const ufMap: Record<string, string> = {
        '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO',
        '21': 'MA', '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE', '29': 'BA',
        '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
        '41': 'PR', '42': 'SC', '43': 'RS',
        '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF'
      };
      
      const uf = ufMap[codUF] || 'XX';
      const current = estadosMap.get(uf) || { uf, total: 0, municipios: new Set(), itens: 0 };
      current.total += item.vlItem || 0;
      current.municipios.add(part.codMun);
      current.itens += 1;
      estadosMap.set(uf, current);
    });
    
    return Array.from(estadosMap.values())
      .sort((a, b) => b.total - a.total)
      .map(e => ({ ...e, municipios: e.municipios.size }));
  }, [itens, participantes]);

  // Classificação de estados por atividade de vendas
  const classificacaoEstados = useMemo(() => {
    const totalGeral = vendasPorEstado.reduce((s, v) => s + v.total, 0);
    
    const resultado = vendasPorEstado.map((e) => {
      const percentualTotal = totalGeral > 0 ? (e.total / totalGeral) * 100 : 0;
      
      let status: 'ativas' | 'novas' | 'recuperadas' | 'quase-inativas' | 'inativas';
      if (percentualTotal >= 15) status = 'ativas';
      else if (percentualTotal >= 8) status = 'novas';
      else if (percentualTotal >= 4) status = 'recuperadas';
      else if (percentualTotal >= 1) status = 'quase-inativas';
      else status = 'inativas';
      
      return { ...e, status, percentual: percentualTotal };
    });
    
    return resultado;
  }, [vendasPorEstado]);

  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>("");

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
    if (!map || !estadosGeojson || vendasPorEstado.length === 0) return;
    
    // Limpa layers anteriores
    map.eachLayer((layer) => {
      if (layer instanceof L.GeoJSON || layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });
    
    // Calcula o máximo para o gradiente
    const maxValor = Math.max(...vendasPorEstado.map(e => e.total), 1);
    
    // Gradiente moderno (azul-roxo-rosa)
    const getCorGradiente = (valor: number) => {
      const intensity = Math.min(valor / maxValor, 1);
      if (intensity > 0.75) return '#0D2B28'; // roxo escuro
      if (intensity > 0.5) return '#14403B';  // roxo médio
      if (intensity > 0.3) return '#3D6259';  // roxo claro
      if (intensity > 0.15) return '#8AAAA5'; // lilás
      return '#DDE8EE'; // quase branco
    };
    
    const estadosMap = new Map(vendasPorEstado.map(e => [e.uf, e]));
    
    estadosGeojson.features.forEach((feature: any) => {
      const sigla = feature.properties?.sigla || feature.properties?.SIGLA || '';
      const estadoInfo = estadosMap.get(sigla);
      
      // Se há filtro e não é o estado filtrado, pula
      if (filtroEstado && filtroEstado !== sigla) return;
      
      // Se não há dados de venda para este estado, renderiza em cinza
      const temVendas = !!estadoInfo;
      const cor = temVendas ? getCorGradiente(estadoInfo.total) : '#D7E2E0';
      
      const layer = L.geoJSON(feature, {
        style: {
          fillColor: cor,
          weight: selectedEstado === sigla ? 2.5 : 1,
          opacity: 1,
          color: selectedEstado === sigla ? '#0D2B28' : '#ffffff',
          fillOpacity: selectedEstado === sigla ? 0.95 : 0.8
        },
        onEachFeature: (feat, lyr) => {
          if (!temVendas) return;
          
          lyr.on({
            mouseover: (e) => {
              const layer = e.target;
              if (selectedEstado !== sigla) {
                layer.setStyle({
                  weight: 2,
                  color: '#0D2B28',
                  fillOpacity: 0.9
                });
              }
            },
            mouseout: (e) => {
              const layer = e.target;
              if (selectedEstado !== sigla) {
                layer.setStyle({
                  weight: 1,
                  color: '#ffffff',
                  fillOpacity: 0.8
                });
              }
            },
            click: () => {
              setSelectedEstado(sigla);
              
              // Foca no estado clicado com animação suave
              const bounds = layer.getBounds();
              map.flyToBounds(bounds, { 
                padding: [100, 100], 
                maxZoom: 6,
                duration: 0.8
              });
            }
          });
        }
      });
      
      layer.addTo(map);
      
      // Adiciona cards informativos no centro de cada estado
      if (temVendas) {
        const bounds = layer.getBounds();
        const center = bounds.getCenter();
        
        // Formatação inteligente do valor
        const valorFormatado = estadoInfo.total >= 1000000 
          ? `${(estadoInfo.total / 1000000).toFixed(1)}M`
          : estadoInfo.total >= 1000
          ? `${(estadoInfo.total / 1000).toFixed(0)}k`
          : `${estadoInfo.total.toFixed(0)}`;
        
        // Card diferente para estado individual vs visualização geral
        const isVisualizacaoGeral = !filtroEstado && !selectedEstado;
        
        const marker = L.marker([center.lat, center.lng], {
          icon: L.divIcon({
            className: 'custom-state-card',
            html: `<div style="
              background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(237, 242, 241, 0.98) 100%); 
              backdrop-filter: blur(12px);
              padding: ${isVisualizacaoGeral ? '10px 12px' : '12px 16px'}; 
              border-radius: ${isVisualizacaoGeral ? '14px' : '18px'}; 
              box-shadow: 0 4px 16px rgba(13, 43, 40, 0.2), 0 0 0 2px rgba(13, 43, 40, 0.1);
              cursor: pointer;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              border: 2px solid transparent;
              min-width: ${isVisualizacaoGeral ? '110px' : '140px'};
            "
            onmouseover="
              this.style.transform='translateY(-4px) scale(1.08)'; 
              this.style.boxShadow='0 12px 28px rgba(13, 43, 40, 0.35), 0 0 0 3px rgba(13, 43, 40, 0.3)'; 
              this.style.borderColor='rgba(13, 43, 40, 0.5)';
            "
            onmouseout="
              this.style.transform='translateY(0) scale(1)'; 
              this.style.boxShadow='0 4px 16px rgba(13, 43, 40, 0.2), 0 0 0 2px rgba(13, 43, 40, 0.1)'; 
              this.style.borderColor='transparent';
            "
            >
              <!-- Sigla do Estado -->
              <div style="
                color: #0D2B28; 
                font-size: ${isVisualizacaoGeral ? '15px' : '18px'}; 
                font-weight: 900;
                margin-bottom: 4px;
                letter-spacing: 1px;
                text-align: center;
              ">${sigla}</div>
              
              <!-- Valor -->
              <div style="
                background: linear-gradient(135deg, #0D2B28 0%, #14403B 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                font-size: ${isVisualizacaoGeral ? '14px' : '16px'};
                font-weight: 800;
                text-align: center;
                margin-bottom: 6px;
              ">R$ ${valorFormatado}</div>
              
              ${isVisualizacaoGeral ? `
              <!-- Informações resumidas para visualização geral -->
              <div style="
                display: flex;
                gap: 8px;
                justify-content: center;
                font-size: 10px;
                color: #6B7C79;
                border-top: 1px solid rgba(13, 43, 40, 0.15);
                padding-top: 6px;
                margin-top: 2px;
              ">
                <span style="display: flex; align-items: center; gap: 2px;">
                  <span style="font-size: 11px;">📍</span>
                  <span style="font-weight: 600;">${estadoInfo.municipios}</span>
                </span>
                <span style="display: flex; align-items: center; gap: 2px;">
                  <span style="font-size: 11px;">📦</span>
                  <span style="font-weight: 600;">${estadoInfo.itens}</span>
                </span>
              </div>
              ` : ''}
            </div>`,
            iconSize: isVisualizacaoGeral ? [120, 85] : [150, 100],
            iconAnchor: isVisualizacaoGeral ? [60, 42] : [75, 50]
          })
        });
        
        marker.on('click', () => {
          setSelectedEstado(sigla);
          const bounds = layer.getBounds();
          map.flyToBounds(bounds, { 
            padding: [100, 100], 
            maxZoom: 6,
            duration: 0.8
          });
        });
        
        marker.addTo(map);
      }
    });
    
    // Ajusta o zoom se houver filtro de estado
    if (filtroEstado) {
      const feature = estadosGeojson.features.find((f: any) => {
        const sigla = f.properties?.sigla || f.properties?.SIGLA || '';
        return sigla === filtroEstado;
      });
      
      if (feature) {
        const layer = L.geoJSON(feature);
        const bounds = layer.getBounds();
        setTimeout(() => {
          map.flyToBounds(bounds, { 
            padding: [100, 100], 
            maxZoom: 6,
            duration: 1
          });
        }, 100);
      }
    } else if (!selectedEstado) {
      // Volta para visualização do Brasil com animação
      setTimeout(() => {
        map.flyTo([-14.235, -51.9253], 4, { duration: 1 });
      }, 100);
    }
  }, [estadosGeojson, vendasPorEstado, selectedEstado, filtroEstado]);

  const estadoSelecionadoInfo = useMemo(() => {
    if (!selectedEstado) return null;
    return vendasPorEstado.find(e => e.uf === selectedEstado);
  }, [selectedEstado, vendasPorEstado]);

  const totalGeral = useMemo(() => {
    return vendasPorEstado.reduce((acc, e) => acc + e.total, 0);
  }, [vendasPorEstado]);

  return (
    <div className="space-y-6">
      {loadingGJ && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground mt-4">Carregando mapa do Brasil...</p>
        </div>
      )}
      {errGJ && (
        <div className="text-center py-8 px-4 bg-destructive/10 text-destructive rounded-xl">
          ⚠️ Erro ao carregar dados geográficos: {errGJ}
        </div>
      )}

      {/* Header com estatísticas */}
      <div className="bg-gradient-to-br from-efd-primary to-destructive dark:from-efd-primary dark:to-destructive p-6 rounded-2xl border border-efd-primary dark:border-efd-primary">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-efd-primary to-destructive bg-clip-text text-transparent">
              Mapa de Vendas do Brasil
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Clique em um estado para ver detalhes
            </p>
          </div>
          
          {/* Resumo geral */}
          <div className="text-right">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Geral</div>
            <div className="text-2xl font-bold text-efd-primary">
              R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-muted-foreground">{vendasPorEstado.length} estados com vendas</div>
          </div>
        </div>

        {/* Filtro de Estado */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <select
              id="filtro-estado"
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value);
                setSelectedEstado(e.target.value || null);
              }}
              className="w-full px-4 py-3 pr-10 rounded-xl border-2 border-efd-primary dark:border-efd-primary bg-white dark:bg-muted focus:outline-none focus:ring-2 focus:ring-efd-primary focus:border-transparent font-medium transition-all"
            >
              <option value="">🗺️ Visualizar Todos os Estados</option>
              {vendasPorEstado.map((estado) => (
                <option key={estado.uf} value={estado.uf}>
                  {estado.uf} - R$ {estado.total.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ({estado.municipios} mun.)
                </option>
              ))}
            </select>
          </div>
          
          {filtroEstado && (
            <button
              onClick={() => {
                setFiltroEstado("");
                setSelectedEstado(null);
              }}
              className="px-6 py-3 rounded-xl bg-destructive text-white hover:bg-destructive transition-all font-medium shadow-md hover:shadow-lg transform hover:scale-105"
            >
              ✕ Limpar
            </button>
          )}
        </div>
      </div>

      {/* Mapa */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-efd-primary dark:border-efd-primary" style={{ height: `${height}px` }}>
        <div 
          ref={mapNode} 
          className="w-full h-full"
        />
        
        {/* Card flutuante com informações do estado selecionado */}
        {estadoSelecionadoInfo && (
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-[1000] animate-scale-in">
            <div className="bg-white/95 dark:bg-muted/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 min-w-[380px] border-2 border-efd-primary">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-efd-primary to-destructive flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {estadoSelecionadoInfo.uf}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">
                        {estadosGeojson?.features?.find((f: any) => 
                          (f.properties?.sigla || f.properties?.SIGLA) === estadoSelecionadoInfo.uf
                        )?.properties?.nome || estadoSelecionadoInfo.uf}
                      </h3>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        {((estadoSelecionadoInfo.total / totalGeral) * 100).toFixed(1)}% do total
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEstado(null)}
                  className="text-muted-foreground hover:text-foreground transition-all text-lg font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-destructive dark:hover:bg-destructive hover:text-destructive"
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Valor Total - Destaque */}
                <div className="bg-gradient-to-br from-efd-primary to-destructive p-6 rounded-2xl text-white shadow-lg">
                  <div className="text-xs font-bold uppercase tracking-wider opacity-90 mb-2">
                    💰 Valor Total Vendido
                  </div>
                  <div className="text-4xl font-extrabold">
                    R$ {estadoSelecionadoInfo.total.toLocaleString('pt-BR', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </div>
                </div>
                
                {/* Estatísticas em Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-primary to-primary dark:from-primary dark:to-primary p-4 rounded-xl border-2 border-primary dark:border-primary">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                        📍
                      </div>
                      <span className="text-xs font-bold text-muted-foreground uppercase">Municípios</span>
                    </div>
                    <div className="text-3xl font-extrabold text-primary">
                      {estadoSelecionadoInfo.municipios}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {estadoSelecionadoInfo.municipios === 1 ? 'município' : 'municípios'}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-success to-success dark:from-success dark:to-success p-4 rounded-xl border-2 border-success dark:border-success">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-success flex items-center justify-center text-white">
                        📦
                      </div>
                      <span className="text-xs font-bold text-muted-foreground uppercase">Itens</span>
                    </div>
                    <div className="text-3xl font-extrabold text-success">
                      {estadoSelecionadoInfo.itens}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {estadoSelecionadoInfo.itens === 1 ? 'item vendido' : 'itens vendidos'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Legenda moderna com gradiente roxo */}
        {!filtroEstado && !selectedEstado && (
          <div className="absolute bottom-6 right-6 z-[1000] bg-white/95 dark:bg-muted/95 backdrop-blur-lg p-5 rounded-2xl shadow-2xl border-2 border-efd-primary dark:border-efd-primary">
            <div className="text-sm font-bold mb-3 text-foreground flex items-center gap-2">
              <span className="text-efd-primary">📊</span>
              Volume de Vendas
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-12">Menor</span>
                <div className="flex-1 h-6 rounded-lg" style={{ 
                  background: 'linear-gradient(to right, #DDE8EE, #8AAAA5, #3D6259, #14403B, #0D2B28)',
                  boxShadow: '0 2px 8px rgba(13, 43, 40, 0.3)'
                }}></div>
                <span className="text-xs text-muted-foreground w-12 text-right">Maior</span>
              </div>
              <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
                Clique nos estados para detalhes
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
