import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Download, QrCode, Plus, Trash2, Upload } from 'lucide-react';
import logoImg from './logo.svg';
import qrcodeImg from './qrcode.svg';

interface ChainItem {
  title: string;
  desc: string;
}

interface RadarItem {
  name: string;
  value: number;
  label: string;
}

interface CardData {
  summary: string;
  title: string;
  trend: 'up' | 'down' | 'neutral';
  dataSource: string;
  chain: ChainItem[];
  radar: RadarItem[];
  risks: { text: string; type: 'up' | 'down' | 'neutral' }[];
}

const defaultRawChain = `【政策触发】印尼政府收紧镍矿开采配额 + 调整HPM基准价公式
【成本机制变化】HPM公式中镍矿品位系数上调，并纳入钴、铁、铬等元素计价→ 实际等同于“资源税+计价体系双重上调”
【产业传导】镍矿现货成本抬升 → 冶炼端利润被压缩→ 市场重新计价远期成本曲线
【盘面反应】沪镍主力合约快速上行，空头回补推动价格走强，沪镍收涨3.91%，报139480元/吨
【现实约束】一级镍社会库存仍处相对高位 → 现货端尚未形成紧缺反馈
【关键变量】印尼是否在7月释放新增配额（政策弹性窗口）`;

const defaultRawRadar = `政策变量 100 印尼政策
成本支撑 90 HPM重估
库存压力 70 未去化
需求端 30 未改善
资金情绪 80 趋势资金`;

const defaultRisks: { text: string; type: 'up' | 'down' | 'neutral' }[] = [
  { text: '印尼是否在7月释放新增配额（政策反转风险）', type: 'down' },
  { text: '一级镍库存是否出现持续累积（压制上行空间）', type: 'down' },
  { text: '成本上移是否能传导至终端需求（利润传导失败风险）', type: 'down' }
];

const parseChain = (text: string): ChainItem[] => {
  return text.split('\n').filter(line => line.trim()).map(line => {
    const match = line.match(/^(?:【|\[)(.*?)(?:】|\])\s*(.*)$/);
    if (match) {
      return { title: match[1].trim(), desc: match[2].trim() };
    }
    const firstSpace = line.trim().search(/[\s:：]/);
    if (firstSpace !== -1) {
      return { 
        title: line.substring(0, firstSpace).trim(), 
        desc: line.substring(firstSpace + 1).trim() 
      };
    }
    return { title: '环节', desc: line.trim() };
  });
};

const parseRadar = (text: string): RadarItem[] => {
  return text.split('\n').filter(line => line.trim()).map(line => {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 2) {
      const name = parts[0];
      const value = parseInt(parts[1], 10);
      if (!isNaN(value)) {
        const desc = parts.slice(2).join(' ').replace(/^[（\(]|[）\)]$/g, '');
        return { name, value, label: desc || '' };
      }
    }
    return { name: line.trim().substring(0, 4), label: '', value: 50 };
  });
};

const getRiskType = (text: string): 'up' | 'down' | 'neutral' => {
  const upMatch = text.match(/利多|利好|支撑|涨|走强|紧缺|反弹|向上|抬升|上行/g) || [];
  const downMatch = text.match(/利空|压制|跌|走弱|宽松|回落|向下|累积|失败|下行/g) || [];
  if (upMatch.length > downMatch.length) return 'up';
  if (downMatch.length > upMatch.length) return 'down';
  return 'neutral';
};

const defaultData: CardData = {
  summary: "今天商品市场的核心交易主线是：“镍端供应收紧 + 新能源传闻扰动 + 航运情绪回落”三条线索的再定价过程。",
  title: "沪镍：印尼政策重估驱动的成本抬升行情",
  trend: 'up',
  dataSource: "以上内容来自XX期货等期货公司公开研报，呈现形式由AI辅助生成",
  chain: parseChain(defaultRawChain),
  radar: parseRadar(defaultRawRadar),
  risks: defaultRisks
};

export default function App() {
  const [data, setData] = useState<CardData>(defaultData);
  const [rawChain, setRawChain] = useState(defaultRawChain);
  const [rawRadar, setRawRadar] = useState(defaultRawRadar);
  const [isGenerating, setIsGenerating] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [publishTime, setPublishTime] = useState<string>('');
  const cardRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string | null>>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setPublishTime(formatted);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    
    // Update time to exact generation minute
    const now = new Date();
    const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setPublishTime(formatted);
    
    // Wait for React to render the new time
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });
      const url = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = `金十期货卡片-${new Date().getTime()}.jpg`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to generate image', error);
      alert('生成图片失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChainChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawChain(e.target.value);
    setData({ ...data, chain: parseChain(e.target.value) });
  };

  const handleRadarChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawRadar(e.target.value);
    setData({ ...data, radar: parseRadar(e.target.value) });
  };

  const addRisk = () => {
    setData({ ...data, risks: [...data.risks, { text: '', type: 'neutral' }] });
  };

  const updateRisk = (idx: number, field: 'text' | 'type', value: string) => {
    const newRisks = [...data.risks];
    if (field === 'text') {
      newRisks[idx].text = value;
    } else {
      newRisks[idx].type = value as 'up' | 'down' | 'neutral';
    }
    setData({ ...data, risks: newRisks });
  };

  const removeRisk = (idx: number) => {
    setData({ ...data, risks: data.risks.filter((_, i) => i !== idx) });
  };

  const trendColor = data.trend === 'up' ? 'text-[#E02424]' : data.trend === 'down' ? 'text-[#059669]' : 'text-[#1A1A1A]';

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Editor */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8 h-[calc(100vh-4rem)] overflow-y-auto">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">卡片内容编辑</h2>
            
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">核心摘要</label>
                <textarea 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A059] focus:border-[#C5A059] outline-none transition-all"
                  rows={3}
                  value={data.summary}
                  onChange={(e) => setData({...data, summary: e.target.value})}
                />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">主标题</label>
                  <input 
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A059] focus:border-[#C5A059] outline-none transition-all"
                    value={data.title}
                    onChange={(e) => setData({...data, title: e.target.value})}
                  />
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-1">涨跌方向</label>
                  <select 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A059] focus:border-[#C5A059] outline-none transition-all"
                    value={data.trend}
                    onChange={(e) => setData({...data, trend: e.target.value as 'up' | 'down' | 'neutral'})}
                  >
                    <option value="up">大涨 (红)</option>
                    <option value="down">大跌 (绿)</option>
                    <option value="neutral">中性 (黑)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">资料来源</label>
                <input 
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A059] focus:border-[#C5A059] outline-none transition-all"
                  value={data.dataSource}
                  onChange={(e) => setData({...data, dataSource: e.target.value})}
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Trading Chain */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-gray-900">交易链路</h3>
              <span className="text-xs text-gray-500">格式：环节名称 描述（支持带【】或空格分隔）</span>
            </div>
            <textarea 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A059] focus:border-[#C5A059] outline-none transition-all font-mono text-sm leading-relaxed"
              rows={8}
              value={rawChain}
              onChange={handleChainChange}
              placeholder="政策触发 印尼政府收紧镍矿开采配额..."
            />
          </div>

          <hr className="border-gray-200" />

          {/* Trading Radar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-gray-900">交易雷达</h3>
              <span className="text-xs text-gray-500">格式：维度名称 分数 补充说明（自动判断强弱）</span>
            </div>
            <textarea 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C5A059] focus:border-[#C5A059] outline-none transition-all font-mono text-sm leading-relaxed"
              rows={6}
              value={rawRadar}
              onChange={handleRadarChange}
              placeholder="政策变量 100 印尼政策"
            />
          </div>

          <hr className="border-gray-200" />

          {/* Risks */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">风险提示</h3>
              <button onClick={addRisk} className="text-sm text-[#C5A059] hover:text-[#b38f4d] flex items-center">
                <Plus className="w-4 h-4 mr-1" /> 添加风险
              </button>
            </div>
            <div className="space-y-3">
              {data.risks.map((risk, idx) => (
                <div key={idx} className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <textarea 
                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#C5A059] outline-none text-sm"
                    rows={2}
                    value={risk.text}
                    onChange={(e) => updateRisk(idx, 'text', e.target.value)}
                    placeholder="风险描述（括号内的内容将作为小标题）"
                  />
                  <div className="flex flex-col gap-2">
                    <select 
                      className="w-28 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#C5A059] outline-none text-sm"
                      value={risk.type}
                      onChange={(e) => updateRisk(idx, 'type', e.target.value)}
                    >
                      <option value="up">红 (利多)</option>
                      <option value="down">绿 (利空)</option>
                      <option value="neutral">黑 (震荡)</option>
                    </select>
                    <button onClick={() => removeRisk(idx)} className="text-red-400 hover:text-red-600 self-end p-1">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Image Settings */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">图片设置</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">顶部 Logo</label>
                <label className="flex items-center justify-center w-full h-24 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-[#C5A059] focus:outline-none">
                  <span className="flex items-center space-x-2">
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-gray-600 text-sm">上传 Logo</span>
                  </span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setLogoUrl)} />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">底部二维码</label>
                <label className="flex items-center justify-center w-full h-24 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-[#C5A059] focus:outline-none">
                  <span className="flex items-center space-x-2">
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-gray-600 text-sm">上传二维码</span>
                  </span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setQrCodeUrl)} />
                </label>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Preview */}
        <div className="flex flex-col items-center overflow-hidden">
          <div className="mb-6 w-full flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">卡片预览</h2>
            <button 
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex items-center px-4 py-2 bg-[#C5A059] text-white rounded-lg hover:bg-[#b38f4d] transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-2" />
              {isGenerating ? '生成中...' : '下载卡片'}
            </button>
          </div>

          <div className="w-full overflow-x-auto pb-4">
            {/* The Card */}
            <div 
              ref={cardRef}
              className="w-[960px] min-h-[720px] bg-white border border-[#E5E1D8] shadow-[0_20px_40px_rgba(0,0,0,0.06)] p-8 flex flex-col relative shrink-0 mx-auto"
              style={{ fontFamily: '"Source Han Sans", "Noto Sans CJK SC", sans-serif', color: '#1A1A1A' }}
            >
              {/* Header */}
              <div className="flex justify-between items-end border-b-2 border-[#1A1A1A] pb-3 mb-6">
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-8 object-contain" crossOrigin="anonymous" />
                  ) : (
                    <img src={logoImg} alt="Logo" className="h-8 object-contain" crossOrigin="anonymous" />
                  )}
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-[#AAA] font-mono">
                    发布时间：{publishTime}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-[1.2fr_1fr] gap-8 flex-1">
                {/* Insight Hero (spans 2 columns) */}
                <div className="col-span-2 mb-4">
                  <h1 className={`text-[32px] font-bold leading-[1.2] mb-2 ${trendColor}`}>
                    {data.title}
                  </h1>
                  <p className="text-sm text-[#666] leading-[1.6]">
                    {data.summary}
                  </p>
                </div>

                {/* Left Column */}
                <div className="flex flex-col">
                  <div className="text-[11px] uppercase tracking-[1.5px] text-[#C5A059] mb-4 font-bold flex items-center gap-2 after:content-[''] after:h-[1px] after:bg-[#E5E1D8] after:flex-1">
                    基本面因素
                  </div>
                  <div className="flex flex-col gap-2">
                    {data.chain.map((item, idx) => (
                      <React.Fragment key={idx}>
                        <div className="p-3.5 px-4 border-l-[4px] border-[#C5A059] bg-[#F9F9F7] shadow-sm rounded-r">
                          <div className="text-[15px] font-bold text-[#C5A059] mb-1.5 tracking-wide">
                            {item.title}
                          </div>
                          <div className="text-[13px] text-[#333] leading-[1.6]">
                            {item.desc}
                          </div>
                        </div>
                        {idx < data.chain.length - 1 && (
                          <div className="text-center text-lg text-[#C5A059] -my-1.5 font-bold">↓</div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Right Column */}
                <div className="flex flex-col">
                  <div className="text-[11px] uppercase tracking-[1.5px] text-[#C5A059] mb-4 font-bold flex items-center gap-2 after:content-[''] after:h-[1px] after:bg-[#E5E1D8] after:flex-1">
                    交易雷达
                  </div>
                  <div className="mb-8">
                    <div className="h-[200px] w-full -ml-4">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" width={400} height={200} data={data.radar}>
                        <PolarGrid stroke="#E5E1D8" />
                        <PolarAngleAxis dataKey="name" tick={{ fill: '#1A1A1A', fontSize: 11, fontWeight: 'bold' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Score" dataKey="value" stroke="#C5A059" fill="#C5A059" fillOpacity={0.4} isAnimationActive={false} />
                      </RadarChart>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-3 mt-2">
                      {data.radar.map((item, idx) => (
                        <div key={idx} className="text-[11px] flex items-start leading-[1.4]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] mr-2 shrink-0 mt-[4px]"></span>
                          <span className="text-[#666] w-[48px] shrink-0">{item.name}</span>
                          <span className="font-bold text-[#1A1A1A] break-words">{item.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] text-[#888] mt-4 pt-3 border-t border-dashed border-[#E5E1D8] text-center">
                      以上内容为对当天交易线索的总结，不具备任何前瞻、预测意义，强度 ≠ 方向，只代表此因素在当天行情的重要性程度
                    </div>
                  </div>

                  <div className="text-[11px] uppercase tracking-[1.5px] text-[#C5A059] mb-4 font-bold flex items-center gap-2 after:content-[''] after:h-[1px] after:bg-[#E5E1D8] after:flex-1">
                    风险拆解
                  </div>
                  <div className="flex flex-col gap-3">
                    {data.risks.map((risk, idx) => {
                      const colorClass = risk.type === 'up' ? 'text-[#E02424]' : risk.type === 'down' ? 'text-[#059669]' : 'text-[#1A1A1A]';
                      const icon = risk.type === 'up' ? '▲' : risk.type === 'down' ? '▼' : '●';
                      
                      const match = risk.text.match(/[\(（]([^()（）]+)[\)）]/);
                      const subtitle = match ? match[1].trim() : `风险提示 ${idx + 1}`;
                      const mainText = risk.text.replace(/[\(（][^()（）]+[\)）]/, '').trim();

                      return (
                        <div key={idx} className="p-3 border border-[#E5E1D8] rounded">
                          <div className={`font-bold text-[13px] mb-1 flex items-center gap-1.5 ${colorClass}`}>
                            {icon} {subtitle}
                          </div>
                          <div className="text-xs text-[#666] leading-[1.4]">
                            {mainText}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 flex justify-between items-end pt-6 border-t border-[#E5E1D8]">
                <div className="text-[10px] text-[#AAA] max-w-[500px] leading-relaxed">
                  资料来源：{data.dataSource}<br/>
                  免责声明：本卡片仅供参考，不构成任何投资建议。市场有风险，入市需谨慎。
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <h4 className="text-[14px] font-bold mb-0.5 text-[#1A1A1A]">下载金十期货APP</h4>
                    <p className="text-[11px] text-[#888]">获取期货今日盘面线索</p>
                  </div>
                  <div className="w-[72px] h-[72px] p-1 border border-[#E5E1D8] bg-white flex items-center justify-center">
                    {qrCodeUrl ? (
                      <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" crossOrigin="anonymous" />
                    ) : (
                      <img src={qrcodeImg} alt="QR Code" className="w-full h-full object-contain" crossOrigin="anonymous" />
                    )}
                  </div>
                </div>
              </div>

              {/* Watermarks */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute"
                    style={{
                      top: `${10 + i * 18}%`,
                      left: `${15 + (i % 2) * 45}%`,
                      transform: 'rotate(-12deg)',
                      opacity: 0.05
                    }}
                  >
                    {logoUrl ? (
                      <img src={logoUrl} alt="watermark" className="h-12 object-contain" style={{ filter: 'grayscale(100%)' }} crossOrigin="anonymous" />
                    ) : (
                      <img src={logoImg} alt="watermark" className="h-12 object-contain" style={{ filter: 'grayscale(100%)' }} crossOrigin="anonymous" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
