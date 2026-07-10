import { ComponentType } from 'react';

export interface PageDefinition {
  key: string;
  label: string;
  component: ComponentType<any>;
  apiName?: string;
}

// Page component map - will be populated after import
export const pageComponentMap: Record<string, ComponentType<any>> = {};
