import Link from 'next/link'
import { featureCards } from '@/constants/MenuData';


export default function Home() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 主要内容区域 */}
      <div className="container mx-auto px-4 py-16">
        {/* 标题区域 */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Aictr Center - <span className="text-indigo-600">AI创意平台</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            发现世界前沿的AI创意工具，让创意无限！
          </p>
        </div>

        {/* 功能卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {featureCards.map((card) => (
            <div key={card.id} className="group">
              {card.status === 'available' ? (
                <Link href={card.path}>
                  <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border border-gray-100 overflow-hidden">
                    <div className="p-8 text-center">
                      <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">
                        {card.icon}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-4">
                        {card.name}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-1 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                  </div>
                </Link>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden opacity-75">
                  <div className="p-8 text-center">
                    <div className="text-6xl mb-6 opacity-60">
                      {card.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-600 mb-4">
                      {card.name}
                    </h3>
                    <p className="text-gray-500 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                  <div className="bg-gray-300 h-1 w-full"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 底部信息 */}
        <div className="text-center mt-16">
          <p className="text-gray-500">
            选择上方功能卡片开始你的AI创意之旅
          </p>
        </div>
      </div>
    </div>
  )
}