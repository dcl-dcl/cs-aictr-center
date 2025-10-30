'use client'

import React from 'react'
import Image from 'next/image'
import { TaskFile } from '@/types/TaskType'
import { PhotoProvider, PhotoView } from 'react-photo-view'
import 'react-photo-view/dist/react-photo-view.css'

interface RowImageDisplayProps {
  images: TaskFile[]
  className?: string
}

export default function RowImageDisplay({ images, className = '' }: RowImageDisplayProps) {
  if (!images || images.length === 0) {
    return null
  }

  const CARD_SIZE = 40 // 保持与堆叠组件一致的大小

  return (
    <div className={`inline-flex items-center overflow-x-auto flex-nowrap gap-2 ${className}`}>
      <PhotoProvider>
        {images.map((image, index) => {
          const imageUrl = image.preview_url || image.gcs_uri
          return (
            <PhotoView key={image.id || index} src={imageUrl || ''}>
              <div
                className="relative rounded-lg overflow-hidden bg-white border border-gray-200 cursor-pointer"
                style={{ width: CARD_SIZE, height: CARD_SIZE }}
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
  )
}