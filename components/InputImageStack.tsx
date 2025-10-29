'use client'

import React from 'react'
import Image from 'next/image'
import { TaskFile } from '@/types/TaskType'

interface InputImageStackProps {
  images: TaskFile[]
  className?: string
}

export default function InputImageStack({ images, className = '' }: InputImageStackProps) {
  if (!images || images.length === 0) {
    return null
  }
  
  // 如果只有一张图片，直接显示
  if (images.length === 1) {
    const imageUrl = images[0].preview_url || images[0].gcs_uri
    
    return (
      <div className={`relative ${className}`}>
        <div className="border-2 border-red-500 rounded-lg overflow-hidden bg-white shadow-lg w-full h-48">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={images[0].file_name || 'Input image'}
              width={300}
              height={192}
              className="object-contain w-full h-full"
              onError={(e) => {
                console.error('Image load error:', e)
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">图片加载失败</p>
              </div>
            </div>
          )}
        </div>
        <div className="absolute bottom-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
          输入
        </div>
        {images[0].file_name && (
          <div className="mt-2 text-xs text-gray-600 truncate" title={images[0].file_name}>
            {images[0].file_name}
          </div>
        )}
      </div>
    )
  }

  // 多张图片时，显示网格布局
  return (
    <div className={`${className}`}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {images.map((image, index) => {
          const imageUrl = image.preview_url || image.gcs_uri
          
          return (
            <div
              key={image.id || index}
              className="relative border-2 border-red-500 rounded-lg overflow-hidden bg-white shadow-lg"
            >
              <div className="w-full h-32">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={image.file_name || `Input image ${index + 1}`}
                    width={150}
                    height={128}
                    className="object-contain w-full h-full"
                    onError={(e) => {
                      console.error('Image load error:', e)
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
                    <div className="text-center">
                      <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs">加载失败</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 图片序号 */}
              <div className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {index + 1}
              </div>
              
              {/* 文件名 */}
              {/* {image.file_name && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 truncate">
                  {image.file_name}
                </div>
              )} */}
            </div>
          )
        })}
      </div>
    </div>
  )
}