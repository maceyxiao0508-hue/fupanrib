import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Download, AlertTriangle, QrCode, Plus, Trash2, GripVertical } from 'lucide-react';

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
  trend: 'up' | 'down';
  chain: ChainItem[];
  radar: RadarItem[];
  risks: string[];
}

const defaultData: CardData = {
  summary: "今天商品市场的核心交易主线是：“镍端供应收紧 + 新能源传闻扰动 + 航运情绪回落”三条线索的再定价过程。",
  title: "沪镍：印尼政策重估驱动的成本抬升行情",
  trend: 'up',
  chain: [
    { title: "【政策触发】", desc: "印尼政府收紧镍矿开采配额 + 调整HPM基准价公式" },
    { title: "【成本机制变化】", desc: "HPM公式中镍矿品位系数上调，并纳入钴、铁、铬等元素计价→ 实际等同于“资源税+计价体系双重上调”" },
    { title: "【产业传导】", desc: "镍矿现货成本抬升 → 冶炼端利润被压缩→ 市场重新计价远期成本曲线" },
    { title: "【盘面反应】", desc: "沪镍主力合约快速上行，空头回补推动价格走强，沪镍收涨3.91%，报139480元/吨" },
    { title: "【现实约束】", desc: "一级镍社会库存仍处相对高位 → 现货端尚未形成紧缺反馈" },
    { title: "【关键变量】", desc: "印尼是否在7月释放新增配额（政策弹性窗口）" }
  ],
  radar: [
    { name: "政策变量", value: 100, label: "极强（印尼政策）" },
    { name: "成本支撑", value: 100, label: "极强（HPM重估）" },
    { name: "库存压力", value: 80, label: "中高（未去化）" },
    { name: "需求端", value: 40, label: "偏弱（未改善）" },
    { name: "资金情绪", value: 80, label: "偏强（趋势资金）" }
  ],
  risks: [
    "印尼是否在7月释放新增配额（政策反转风险）",
    "一级镍库存是否出现持续累积（压制上行空间）",
    "成本上移是否能传导至终端需求（利润传导失败风险）"
  ]
};

export default function App() {
  const [data, setData] = useState<CardData>(defaultData);
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // Higher resolution
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `金十期货卡片-${new Date().getTime()}.png`;
      link.href = url;
      link.click();
    } catch (error) {
      console.error('Failed to generate image', error);
      alert('生成图片失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateChain = (index: number, field: keyof ChainItem, value: string) => {
    const newChain = [...data.chain];
    newChain[index][field] = value;
    setData({ ...data, chain: newChain });
  };

  const addChainItem = () => {
    setData({ ...data, chain: [...data.chain, { title: '【新环节】', desc: '描述内容' }] });
  };

  const removeChainItem = (index: number) => {
    const newChain = data.chain.filter((_, i) => i !== index);
    setData({ ...data, chain: newChain });
  };

  const updateRadar = (index: number, field: keyof RadarItem, value: string | number) => {
    const newRadar = [...data.radar];
    newRadar[index] = { ...newRadar[index], [field]: value };
    setData({ ...data, radar: newRadar });
  };

  const updateRisk = (index: number, value: string) => {
    const newRisks = [...data.risks];
    newRisks[index] = value;
    setData({ ...data, risks: newRisks });
  };

  const addRisk = () => {
    setData({ ...data, risks: [...data.risks, '新风险提示'] });
  };

  const removeRisk = (index: number) => {
    const newRisks = data.risks.filter((_, i) => i !== index);
    setData({ ...data, risks: newRisks });
  };

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
                    onChange={(e) => setData({...data, trend: e.target.value as 'up' | 'down'})}
                  >
                    <option value="up">大涨 (红)</option>
                    <option value="down">大跌 (绿)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Trading Chain */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">交易链路</h3>
              <button onClick={addChainItem} className="text-sm text-[#C5A059] hover:text-[#b38f4d] flex items-center">
                <Plus className="w-4 h-4 mr-1" /> 添加环节
              </button>
            </div>
            <div className="space-y-3">
              {data.chain.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <GripVertical className="w-5 h-5 text-gray-400 mt-3 cursor-move" />
                  <div className="flex-1 space-y-2">
                    <input 
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#C5A059] outline-none text-sm font-bold"
                      value={item.title}
                      onChange={(e) => updateChain(idx, 'title', e.target.value)}
                      placeholder="【环节名称】"
                    />
                    <textarea 
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#C5A059] outline-none text-sm"
                      rows={2}
                      value={item.desc}
                      onChange={(e) => updateChain(idx, 'desc', e.target.value)}
                      placeholder="环节描述"
                    />
                  </div>
                  <button onClick={() => removeChainItem(idx)} className="text-red-400 hover:text-red-600 mt-2">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Trading Radar */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">交易雷达</h3>
            <div className="space-y-3">
              {data.radar.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <input 
                    type="text"
                    className="w-1/4 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#C5A059] outline-none text-sm"
                    value={item.name}
                    onChange={(e) => updateRadar(idx, 'name', e.target.value)}
                    placeholder="维度名称"
                  />
                  <input 
                    type="number"
                    min="0"
                    max="100"
                    className="w-20 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#C5A059] outline-none text-sm"
                    value={item.value}
                    onChange={(e) => updateRadar(idx, 'value', parseInt(e.target.value) || 0)}
                    placeholder="分数"
                  />
                  <input 
                    type="text"
                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#C5A059] outline-none text-sm"
                    value={item.label}
                    onChange={(e) => updateRadar(idx, 'label', e.target.value)}
                    placeholder="标签描述"
                  />
                </div>
              ))}
            </div>
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
                <div key={idx} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <input 
                    type="text"
                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#C5A059] outline-none text-sm"
                    value={risk}
                    onChange={(e) => updateRisk(idx, e.target.value)}
                    placeholder="风险描述"
                  />
                  <button onClick={() => removeRisk(idx)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
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
              className="w-[960px] h-[720px] bg-white border border-[#E5E1D8] shadow-[0_20px_40px_rgba(0,0,0,0.06)] p-8 flex flex-col relative shrink-0 mx-auto"
              style={{ fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif', color: '#1A1A1A' }}
            >
              {/* Header */}
              <div className="flex justify-between items-end border-b-2 border-[#1A1A1A] pb-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#C5A059] rounded flex items-center justify-center text-white font-bold text-lg">
                    金
                  </div>
                  <span className="font-[800] text-2xl tracking-tight">金十期货APP</span>
                </div>
                <span className="text-xs uppercase tracking-[2px] text-[#888] font-semibold">
                  Market Intelligence Insight
                </span>
              </div>

              <div className="grid grid-cols-[1.2fr_1fr] gap-8 flex-1">
                {/* Insight Hero (spans 2 columns) */}
                <div className="col-span-2 mb-4">
                  <h1 className={`text-[32px] font-bold leading-[1.2] mb-2 ${data.trend === 'up' ? 'text-[#E02424]' : 'text-[#059669]'}`}>
                    {data.title}
                  </h1>
                  <p className="text-sm text-[#666] leading-[1.6]">
                    {data.summary}
                  </p>
                </div>

                {/* Left Column */}
                <div className="flex flex-col">
                  <div className="text-[11px] uppercase tracking-[1.5px] text-[#C5A059] mb-4 font-bold flex items-center gap-2 after:content-[''] after:h-[1px] after:bg-[#E5E1D8] after:flex-1">
                    交易链路 TRADING LINKAGE
                  </div>
                  <div className="flex flex-col gap-2">
                    {data.chain.map((item, idx) => (
                      <React.Fragment key={idx}>
                        <div className={`p-3 px-4 border-l-[3px] border-[#C5A059] text-[13px] leading-[1.5] ${idx === 3 ? 'bg-[#1A1A1A] text-white' : 'bg-[#F9F9F7]'}`}>
                          <strong className={`block text-[11px] mb-0.5 font-normal ${idx === 3 ? 'text-gray-300' : 'text-[#888]'}`}>{item.title}</strong>
                          {item.desc}
                        </div>
                        {idx < data.chain.length - 1 && (
                          <div className="text-center text-xs text-[#C5A059] -my-1">↓</div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Right Column */}
                <div className="flex flex-col">
                  <div className="text-[11px] uppercase tracking-[1.5px] text-[#C5A059] mb-4 font-bold flex items-center gap-2 after:content-[''] after:h-[1px] after:bg-[#E5E1D8] after:flex-1">
                    交易雷达 RADAR SYSTEM
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
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {data.radar.map((item, idx) => (
                        <div key={idx} className="text-[11px] flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] mr-2"></span>
                          <span className="text-[#666] w-16">{item.name}</span>
                          <span className="font-bold text-[#1A1A1A]">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-[11px] uppercase tracking-[1.5px] text-[#C5A059] mb-4 font-bold flex items-center gap-2 after:content-[''] after:h-[1px] after:bg-[#E5E1D8] after:flex-1">
                    风险拆解 RISK ANALYSIS
                  </div>
                  <div className="flex flex-col gap-3">
                    {data.risks.map((risk, idx) => (
                      <div key={idx} className="p-3 border border-[#E5E1D8] rounded">
                        <div className={`font-bold text-[13px] mb-1 flex items-center gap-1.5 ${idx === 0 ? 'text-[#E02424]' : (idx === 1 ? 'text-[#059669]' : 'text-[#E02424]')}`}>
                          {idx === 0 ? '▲' : (idx === 1 ? '▼' : '●')} 风险提示 {idx + 1}
                        </div>
                        <div className="text-xs text-[#666] leading-[1.4]">
                          {risk}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-auto flex justify-between items-end pt-6 border-t border-[#E5E1D8]">
                <div className="text-[10px] text-[#AAA] max-w-[500px] leading-relaxed">
                  资料来源：金十期货研究中心、印尼能矿部(ESDM)公示文件<br/>
                  免责声明：本卡片仅供参考，不构成任何投资建议。市场有风险，入市需谨慎。
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <h4 className="text-[14px] font-bold mb-0.5 text-[#1A1A1A]">下载金十期货APP</h4>
                    <p className="text-[11px] text-[#888]">获取品种异动实时情报</p>
                  </div>
                  <div className="w-16 h-16 p-1 border border-[#E5E1D8] bg-white">
                    <QrCode className="w-full h-full text-[#1A1A1A]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

