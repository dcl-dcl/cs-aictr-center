'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { TaskFile } from '@/types/TaskType'
import { PhotoProvider, PhotoView } from 'react-photo-view'
import 'react-photo-view/dist/react-photo-view.css'

interface StackedImageDisplayProps {
  images: TaskFile[]
  className?: string
}

export default function StackedImageDisplay({ images, className = ''}: StackedImageDisplayProps) {
  const [isHovered, setIsHovered] = useState(false)

  if (!images || images.length === 0) {
    return null
  }

  // 配置卡片堆叠的视觉参数
  const visibleImages = images.slice(0, 5)
  const CARD_SIZE = 40 // 更小正方形尺寸
  const OVERLAP = 12 // 基础重叠偏移（非 hover）
  const ROTATIONS = [-6, -3, 0, 3, 6].slice(0, visibleImages.length)

  const containerWidth = CARD_SIZE + OVERLAP * (visibleImages.length - 1)
  const containerHeight = CARD_SIZE

  return (
    <div
      className={`inline-flex items-center gap-2 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative" style={{ width: containerWidth, height: containerHeight, perspective: '900px' }}>
        <PhotoProvider>
        {visibleImages.map((image, index) => {
          const imageUrl = image.preview_url || image.gcs_uri
          const baseX = index * OVERLAP
          const baseY = Math.max(0, (visibleImages.length - index - 1)) * 2
          const rotate = ROTATIONS[index] || 0

        const translateX = isHovered ? baseX + index * 6 : baseX
        const translateY = isHovered ? baseY + index * 2 : baseY
        const zIndex = 100 + index
        const shadow = isHovered
          ? '0 18px 30px rgba(0,0,0,0.22), 0 8px 12px rgba(0,0,0,0.12)'
          : '0 10px 20px rgba(0,0,0,0.18), 0 6px 10px rgba(0,0,0,0.1)'

          return (
            <PhotoView key={image.id || index} src={imageUrl || ''}>
              <div
                className="absolute rounded-lg overflow-hidden bg-white border border-gray-200 cursor-pointer"
                style={{
                  width: CARD_SIZE,
                  height: CARD_SIZE,
                  left: translateX,
                  top: translateY,
                  transform: `rotateZ(${rotate}deg) translateZ(${index * 2}px)`,
                  boxShadow: shadow,
                  zIndex,
                  transition: 'left 240ms ease, top 240ms ease, transform 240ms ease, box-shadow 240ms ease'
                }}
              >
                {imageUrl ? (
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <Image
                      src={imageUrl}
                      alt={image.file_name || `Input image ${index + 1}`}
                      fill
                      sizes={`${CARD_SIZE}px`}
                      style={{ objectFit: 'cover' }}
                      onError={(e) => {
                        console.error('Image load error:', e)
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
            </PhotoView>
          )
        })}
        </PhotoProvider>
      </div>
    </div>
  )
}