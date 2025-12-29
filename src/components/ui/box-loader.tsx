"use client"

import type React from "react"

const BoxLoader: React.FC = () => {
    return (
        <div className="flex items-center justify-center">
            <div className="relative w-16 h-16">
                {/* Outer rotating ring */}
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-foreground animate-spin"
                    style={{ animationDuration: '0.8s' }} />

                {/* Inner rotating ring (opposite direction) */}
                <div className="absolute inset-3 rounded-full border-2 border-transparent border-b-foreground/50 animate-spin"
                    style={{ animationDuration: '1.2s', animationDirection: 'reverse' }} />

                {/* Center dot */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-foreground animate-pulse" />
                </div>
            </div>
        </div>
    )
}

export default BoxLoader
