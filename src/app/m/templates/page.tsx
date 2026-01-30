"use client";

import React, { useState } from 'react';
import { TemplateSwitcher } from '@/components/mobile/TemplateSwitcher';
import { MobileTemplate1 } from '@/components/mobile/templates/MobileTemplate1';
import { MobileTemplate2 } from '@/components/mobile/templates/MobileTemplate2';
import { MobileTemplate3 } from '@/components/mobile/templates/MobileTemplate3';
import { MobileTemplate4 } from '@/components/mobile/templates/MobileTemplate4';
import { MobileTemplate5 } from '@/components/mobile/templates/MobileTemplate5';

export default function TemplateShowcasePage() {
    const [activeTemplate, setActiveTemplate] = useState('1');

    const renderTemplate = () => {
        switch (activeTemplate) {
            case '1':
                return <MobileTemplate1 />;
            case '2':
                return <MobileTemplate2 />;
            case '3':
                return <MobileTemplate3 />;
            case '4':
                return <MobileTemplate4 />;
            case '5':
                return <MobileTemplate5 />;
            default:
                return <MobileTemplate1 />;
        }
    };

    return (
        <>
            {renderTemplate()}
            <TemplateSwitcher
                currentTemplate={activeTemplate}
                onTemplateChange={setActiveTemplate}
            />
        </>
    );
}
