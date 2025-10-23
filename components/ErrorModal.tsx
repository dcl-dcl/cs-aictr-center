'use client'
import { useEffect } from 'react';

interface ErrorModalProps {
    isOpen: boolean;
    error: string | null;
    onClose: () => void;
    title?: string;
    autoClose?: boolean;
    autoCloseDelay?: number;
}

export default function ErrorModal({ 
    isOpen, 
    error, 
    onClose, 
    title = "错误提示",
    autoClose = false,
    autoCloseDelay = 5000
}: ErrorModalProps) {
    // 自动关闭功能（可选）
    useEffect(() => {
        if (isOpen && autoClose) {
            const timer = setTimeout(() => {
                onClose();
            }, autoCloseDelay);
            return () => clearTimeout(timer);
        }
    }, [isOpen, autoClose, autoCloseDelay, onClose]);

    // ESC键关闭
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose]);

    if (!isOpen || !error) return null;

    return (
        <div className="fixed inset-0 bg-[rgba(60,53,53,0.5)] bg-opacity-30 flex items-center justify-center z-50">
            {/* 背景遮罩 */}
            <div 
                className="fixed inset-0 bg-[rgba(60,53,53,0.5)] bg-opacity-30 transition-opacity"
                onClick={onClose}
            ></div>
            
            {/* 弹窗内容 */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 animate-in fade-in-0 zoom-in-95 duration-200">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3 flex-1">
                        <h3 className="text-lg font-medium text-red-800 mb-2">{title}</h3>
                        <div className="text-sm text-red-700 whitespace-pre-wrap">
                            {error}
                        </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                        <button
                            className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                            onClick={onClose}
                        >
                            <span className="sr-only">关闭</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
                
                {/* 按钮区域 */}
                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                        onClick={onClose}
                    >
                        取消
                    </button>
                    <button
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                        onClick={onClose}
                    >
                        确定
                    </button>
                </div>
            </div>
        </div>
    );
}