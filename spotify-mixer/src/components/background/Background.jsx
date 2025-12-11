'use client';

import {Opulento} from "uvcanvas";

export default function Background() {
    return (
        <div className='fixed inset-0 w-full h-screen z-[-1] opacity-20'>
            <Opulento />
        </div>
    );
}  