import React from 'react';

interface ImageUploadProps {
    imageUrl?: string;
    onImageChange: (file: File | null) => void;
    title: string;
    className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
    imageUrl,
    onImageChange,
    title,
    className = '',
}) => {
    return (
        <div className={`w-full h-[200px] ${className}`}>
            <div className="border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 h-full">
                <div className="relative w-full h-full bg-gray-50 rounded-lg overflow-hidden group">
                    {imageUrl ? (
                        <>
                            <div className="w-full h-full flex items-center justify-center p-4">
                                <img
                                    src={imageUrl}
                                    alt={title}
                                    className="max-w-full max-h-full object-contain"
                                />
                            </div>
                            <button
                                onClick={() => onImageChange(null)}
                                className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity duration-200"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <label className="absolute bottom-2 left-1/2 -translate-x-1/2 cursor-pointer">
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            onImageChange(file);
                                        }
                                    }}
                                />
                                <div className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 bg-white/80 px-3 py-1 rounded-full">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span className="text-sm font-medium">更换{title}</span>
                                </div>
                            </label>
                        </>
                    ) : (
                        <label className="cursor-pointer block w-full h-full">
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        onImageChange(file);
                                    }
                                }}
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="mt-4 text-sm font-medium text-gray-900">点击上传{title}</p>
                                <p className="mt-2 text-xs text-gray-500">支持 PNG, WEBP, JPEG, JPG 格式</p>
                            </div>
                        </label>
                    )}
                </div>
            </div>
        </div>
    );
};