declare module 'recharts' {
  import type { ComponentType, ReactNode } from 'react';

  type ChartProps = {
    data?: Record<string, unknown>[];
    children?: ReactNode;
    layout?: 'horizontal' | 'vertical';
    margin?: Record<string, number>;
  };

  export const ResponsiveContainer: ComponentType<{
    width?: string | number;
    height?: string | number;
    children?: ReactNode;
  }>;

  export const BarChart: ComponentType<ChartProps>;
  export const LineChart: ComponentType<ChartProps>;
  export const Bar: ComponentType<Record<string, unknown>>;
  export const Line: ComponentType<Record<string, unknown>>;
  export const XAxis: ComponentType<Record<string, unknown>>;
  export const YAxis: ComponentType<Record<string, unknown>>;
  export const CartesianGrid: ComponentType<Record<string, unknown>>;
  export const Tooltip: ComponentType<{
    formatter?: (value: number) => string;
  }>;
  export const Legend: ComponentType<Record<string, unknown>>;
}
