import { GenerateConfig } from '@/types/BaseType'
import { useState, useEffect, useRef } from 'react'

export interface ModelOption {
    label: string;
    value: string;
}

export const ModelSelect: React.FC<{
    title: string;
    options: ModelOption[];
    value: string;
    onChange: (value: string) => void;
}> = ({ title, options, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const selectedOption = options.find(option => option.value === value);

    // 点击外部关闭下拉框
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    return (
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2 relative" ref={dropdownRef}>
                <span className="text-2xl font-semibold text-black">{title}</span>
                <div className="relative">
                    <div 
                        className="flex items-center text-3xl font-semibold text-blue-600 bg-transparent border-none border-b-2 border-b-blue-600 outline-none cursor-pointer pb-1"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <span>{selectedOption?.label}</span>
                        <svg 
                            className={`ml-2 w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                        >
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </div>
                    {isOpen && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-full">
                            {options.map((option) => (
                                <div
                                    key={option.value}
                                    className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                                        option.value === value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                                    }`}
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                >
                                    <div>
                                        {option.label}
                                        <div className="text-xs text-gray-500 mt-1">{option.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// 初始化配置选择
export const initializeConfigSelections = (Configs: GenerateConfig[]) => {
    const initialSelections: {[key: string]: any} = {};
    Configs.forEach(config => {
        initialSelections[config.id] = config.defaultValue;
    });
    return initialSelections;
};

