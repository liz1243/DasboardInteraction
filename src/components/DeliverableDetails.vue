<script setup>
import { ref, computed } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent
} from 'echarts/components';

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent, MarkLineComponent]);

// --- Datos estáticos ---
const dataPoints = [
  // Live broadcast 12:00 PM - 2:00 PM
  { time: '12:00 PM', clicks: 10, registers: 5, deposits: 2 },
  { time: '12:30 PM', clicks: 20, registers: 10, deposits: 4 },
  { time: '1:00 PM', clicks: 30, registers: 15, deposits: 6 },
  { time: '1:30 PM', clicks: 40, registers: 20, deposits: 8 },
  { time: '2:00 PM', clicks: 50, registers: 25, deposits: 10 }, // End
  // Post-show 2:30 PM - 5:00 PM
  { time: '2:30 PM', clicks: 40, registers: 35, deposits: 12 },
  { time: '3:00 PM', clicks: 30, registers: 45, deposits: 15 },
  { time: '3:30 PM', clicks: 20, registers: 55, deposits: 20 },
  { time: '4:00 PM', clicks: 10, registers: 65, deposits: 25 },
  { time: '4:30 PM', clicks: 5, registers: 75, deposits: 30 },
  { time: '5:00 PM', clicks: 2, registers: 85, deposits: 35 }
];

const xLabelsRelative = [
  'Start', '+30m', '+60m', '+90m', 'End', '', '', '', '', '', ''
];
const xLabelsAbsolute = dataPoints.map(d => d.time);

const clicks = dataPoints.map(d => d.clicks);
const registers = dataPoints.map(d => d.registers);
const deposits = dataPoints.map(d => d.deposits);

const chartOptions = computed(() => ({
  backgroundColor: '#1e1e1e',
  tooltip: { trigger: 'axis' },
  xAxis: [
    {
      type: 'category',
      data: xLabelsRelative,
      position: 'top',
      axisLine: { lineStyle: { color: '#fff' } },
      axisLabel: { color: '#fff' },
      name: 'Show Time (2hr broadcast)',
      nameLocation: 'middle',
      nameGap: 30
    },
    {
      type: 'category',
      data: xLabelsAbsolute,
      position: 'bottom',
      axisLine: { lineStyle: { color: '#fff' } },
      axisLabel: { color: '#fff' },
      name: 'Country Time (EST)',
      nameLocation: 'middle',
      nameGap: 30
    }
  ],
  yAxis: {
    type: 'value',
    min: 0,
    name: 'Metrics (count)',
    nameTextStyle: { color: '#fff', fontWeight: 'bold' },
    axisLine: { lineStyle: { color: '#fff' } },
    axisLabel: { color: '#fff' },
    splitLine: { lineStyle: { type: 'dashed', color: '#666' } }
  },
  series: [
    {
      name: 'Clicks',
      type: 'line',
      data: clicks,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 3, color: '#b37feb' },
      areaStyle: { color: 'rgba(179,127,235,0.2)' },
      markLine: {
        silent: true,
        data: [
          {
            xAxis: xLabelsRelative[4],
            lineStyle: { type: 'dashed', color: 'red', width: 2 },
          }
        ]
      }
    },
    {
      name: 'Registers',
      type: 'line',
      data: registers,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 3, color: '#66d1ff' },
      areaStyle: { color: 'rgba(102,209,255,0.2)' }
    },
    {
      name: 'Deposits',
      type: 'line',
      data: deposits,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 3, color: '#39ff9f' },
      areaStyle: { color: 'rgba(57,255,159,0.2)' }
    }
  ],
  legend: { top: 0, textStyle: { color: '#fff' } }
}));
</script>


<template>
  <div ref="chartContainer" style="height:500px; width:100%;">
    <v-chart :option="chartOptions" :autoresize="true"/>
  </div>
</template>
