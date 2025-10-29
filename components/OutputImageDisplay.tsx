'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { TaskFile } from '@/types/TaskType'

interface OutputImageDisplayProps {
  images: TaskFile[]
  className?: string
}

export default function OutputImageDisplay({ images, className = '' }: OutputImageDisplayProps) {
  const [previewImage, setPreviewImage] = useState<TaskFile | null>(null)
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())
  
  if (!images || images.length === 0) {
    return null
  }

  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set(prev).add(index))
  }

  const handleDownload = async (image: TaskFile) => {
    try {
      const imageUrl = image.preview_url || image.gcs_uri
      if (!imageUrl) {
        console.error('No valid image URL found')
        return
      }

      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error('Failed to fetch image')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = image.file_name || 'image'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  return (
    <>
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {images.map((image, index) => {
          const imageUrl = image.preview_url || image.gcs_uri
          const hasError = imageErrors.has(index)
          
          return (
            <div key={index} className="relative group">
              <div className="border-2 border-green-500 rounded-lg overflow-hidden bg-white shadow-lg">
                {imageUrl && !hasError ? (
                  <div className="relative w-full h-48">
                    <Image
                      src={imageUrl}
                      alt={image.file_name || `Output image ${index + 1}`}
                      fill
                      className="object-contain hover:scale-105 transition-transform duration-200"
                      onError={() => handleImageError(index)}
                    />
                    {/* 预览和下载按钮 */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {/* 预览按钮 */}
                      <button
                        onClick={() => setPreviewImage(image)}
                        className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                        title="预览图片"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      {/* 下载按钮 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownload(image)
                        }}
                        className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                        title="下载图片"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-48 flex items-center justify-center bg-gray-100 text-gray-500">
                    <div className="text-center">
                      <Image
                        src="/placeholder-image.svg"
                        alt="默认图片"
                        width={48}
                        height={48}
                        className="mx-auto mb-2 opacity-50"
                      />
                      <p className="text-sm">图片加载失败</p>
                      <p className="text-xs text-gray-400 mt-1">点击重试</p>
                      <button
                        onClick={() => {
                          setImageErrors(prev => {
                            const newSet = new Set(prev)
                            newSet.delete(index)
                            return newSet
                          })
                        }}
                        className="mt-2 px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                      >
                        重新加载
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 标签和文件名 */}
              <div className="mt-2 text-xs text-gray-600 truncate">
                <span>{image.file_mime_type}</span>
                <span className="ml-2">{image.aspect_ratio}</span>
                <span className="ml-2">{image.file_name}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 预览模态框 */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
              <div className="relative">
                <Image
                  src={previewImage.preview_url || previewImage.gcs_uri || '/placeholder-image.svg'}
                  alt={previewImage.file_name || 'Preview image'}
                  width={800}
                  height={600}
                  className="object-contain max-h-[80vh]"
                />
              </div>
              <div className="p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{previewImage.file_name}</h3>
                    <p className="text-sm text-gray-500">
                      {previewImage.file_mime_type} • {previewImage.aspect_ratio}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownload(previewImage)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    下载
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}