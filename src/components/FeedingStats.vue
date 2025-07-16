<template>
  <div class="feeding-stats">
    <!-- 时间范围选择器 -->
    <a-row :gutter="16" class="mb-4">
      <a-col :span="12">
        <a-radio-group v-model:value="timeRange" button-style="solid">
          <a-radio-button value="week">最近7天</a-radio-button>
          <a-radio-button value="month">最近30天</a-radio-button>
          <a-radio-button value="custom">自定义</a-radio-button>
        </a-radio-group>
      </a-col>
      <a-col :span="12" v-if="timeRange === 'custom'">
        <a-range-picker v-model:value="customDateRange" :disabled-date="disabledDate" />
      </a-col>
    </a-row>
    
    <!-- 摄入量统计卡片 -->
    <a-card title="摄入量统计" class="mb-4">
      <div ref="amountChartContainer" class="chart-container"></div>
    </a-card>
    
    <!-- 吃奶类型分布卡片 -->
    <a-card title="吃奶类型分布" class="mb-4">
      <div ref="typeChartContainer" class="chart-container"></div>
    </a-card>
    
    <!-- 吃奶时间分布卡片 -->
    <a-card title="吃奶时间分布" class="mb-4">
      <div ref="timeChartContainer" class="chart-container"></div>
    </a-card>
    
    <!-- 吃奶与排泄关联分析卡片 -->
    <a-card title="吃奶与排泄关联分析" class="mb-4">
      <div ref="correlationChartContainer" class="chart-container"></div>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart, ScatterChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import dayjs from 'dayjs'

// 注册必要的组件
echarts.use([GridComponent, TooltipComponent, TitleComponent, LegendComponent, BarChart, LineChart, PieChart, ScatterChart, CanvasRenderer])

const props = defineProps({
  feedingRecords: {
    type: Array,
    required: true
  },
  excretionRecords: {
    type: Array,
    required: true
  }
})

// 时间范围选择
const timeRange = ref('week')
const customDateRange = ref([dayjs().subtract(7, 'day'), dayjs()])

// 图表容器引用
const amountChartContainer = ref(null)
const typeChartContainer = ref(null)
const timeChartContainer = ref(null)
const correlationChartContainer = ref(null)

// 图表实例
let amountChart = null
let typeChart = null
let timeChart = null
let correlationChart = null

// 禁用未来日期
const disabledDate = (current) => {
  return current && current > dayjs().endOf('day')
}

// 根据选择的时间范围过滤记录
const filteredFeedingRecords = computed(() => {
  let startDate, endDate
  
  if (timeRange.value === 'week') {
    startDate = dayjs().subtract(6, 'day').startOf('day')
    endDate = dayjs().endOf('day')
  } else if (timeRange.value === 'month') {
    startDate = dayjs().subtract(29, 'day').startOf('day')
    endDate = dayjs().endOf('day')
  } else {
    startDate = dayjs(customDateRange.value[0]).startOf('day')
    endDate = dayjs(customDateRange.value[1]).endOf('day')
  }
  
  return props.feedingRecords.filter(record => {
    const recordDate = dayjs(record.time)
    return recordDate >= startDate && recordDate <= endDate
  })
})

const filteredExcretionRecords = computed(() => {
  let startDate, endDate
  
  if (timeRange.value === 'week') {
    startDate = dayjs().subtract(6, 'day').startOf('day')
    endDate = dayjs().endOf('day')
  } else if (timeRange.value === 'month') {
    startDate = dayjs().subtract(29, 'day').startOf('day')
    endDate = dayjs().endOf('day')
  } else {
    startDate = dayjs(customDateRange.value[0]).startOf('day')
    endDate = dayjs(customDateRange.value[1]).endOf('day')
  }
  
  return props.excretionRecords.filter(record => {
    const recordDate = dayjs(record.time)
    return recordDate >= startDate && recordDate <= endDate
  })
})

// 计算每日摄入量数据
const dailyAmountData = computed(() => {
  const data = {}
  let startDate, endDate
  
  if (timeRange.value === 'week') {
    startDate = dayjs().subtract(6, 'day')
    endDate = dayjs()
  } else if (timeRange.value === 'month') {
    startDate = dayjs().subtract(29, 'day')
    endDate = dayjs()
  } else {
    startDate = dayjs(customDateRange.value[0])
    endDate = dayjs(customDateRange.value[1])
  }
  
  // 初始化日期范围内的所有日期
  for (let d = startDate; d <= endDate; d = d.add(1, 'day')) {
    const dateStr = d.format('YYYY-MM-DD')
    data[dateStr] = 0
  }
  
  // 累加每日摄入量
  filteredFeedingRecords.value.forEach(record => {
    const dateStr = dayjs(record.time).format('YYYY-MM-DD')
    if (data[dateStr] !== undefined) {
      data[dateStr] += record.amount
    }
  })
  
  return data
})

// 计算吃奶类型分布数据
const feedingTypeData = computed(() => {
  const typeCount = {
    '母乳': 0,
    '配方奶': 0,
    '混合': 0
  }
  
  filteredFeedingRecords.value.forEach(record => {
    if (typeCount[record.type] !== undefined) {
      typeCount[record.type]++
    }
  })
  
  return Object.keys(typeCount).map(type => ({
    name: type,
    value: typeCount[type]
  }))
})

// 计算吃奶时间分布数据
const feedingTimeDistribution = computed(() => {
  const hourlyCount = Array(24).fill(0)
  
  filteredFeedingRecords.value.forEach(record => {
    const hour = dayjs(record.time).hour()
    hourlyCount[hour]++
  })
  
  return hourlyCount
})

// 计算吃奶与排泄关联数据
const correlationData = computed(() => {
  // 按日期分组计算
  const dailyData = {}
  
  // 初始化日期范围内的所有日期
  let startDate, endDate
  if (timeRange.value === 'week') {
    startDate = dayjs().subtract(6, 'day')
    endDate = dayjs()
  } else if (timeRange.value === 'month') {
    startDate = dayjs().subtract(29, 'day')
    endDate = dayjs()
  } else {
    startDate = dayjs(customDateRange.value[0])
    endDate = dayjs(customDateRange.value[1])
  }
  
  for (let d = startDate; d <= endDate; d = d.add(1, 'day')) {
    const dateStr = d.format('YYYY-MM-DD')
    dailyData[dateStr] = {
      amount: 0,
      pee: 0,
      poop: 0
    }
  }
  
  // 累加每日摄入量
  filteredFeedingRecords.value.forEach(record => {
    const dateStr = dayjs(record.time).format('YYYY-MM-DD')
    if (dailyData[dateStr] !== undefined) {
      dailyData[dateStr].amount += record.amount
    }
  })
  
  // 累加每日排泄次数
  filteredExcretionRecords.value.forEach(record => {
    const dateStr = dayjs(record.time).format('YYYY-MM-DD')
    if (dailyData[dateStr] !== undefined) {
      if (record.type === '小便') dailyData[dateStr].pee++
      if (record.type === '大便') dailyData[dateStr].poop++
      if (record.type === '大小便') {
        dailyData[dateStr].pee++
        dailyData[dateStr].poop++
      }
    }
  })
  
  return dailyData
})

onMounted(() => {
  // 初始化图表
  amountChart = echarts.init(amountChartContainer.value)
  typeChart = echarts.init(typeChartContainer.value)
  timeChart = echarts.init(timeChartContainer.value)
  correlationChart = echarts.init(correlationChartContainer.value)
  
  // 更新所有图表
  updateAllCharts()
  
  // 监听窗口大小变化，调整图表大小
  window.addEventListener('resize', () => {
    amountChart.resize()
    typeChart.resize()
    timeChart.resize()
    correlationChart.resize()
  })
})

// 监听数据变化，更新图表
watch([filteredFeedingRecords, filteredExcretionRecords, timeRange, customDateRange], updateAllCharts, { deep: true })

// 更新所有图表
function updateAllCharts() {
  updateAmountChart()
  updateTypeChart()
  updateTimeChart()
  updateCorrelationChart()
}

// 更新摄入量图表
function updateAmountChart() {
  const data = dailyAmountData.value
  const dates = Object.keys(data)
  const amounts = Object.values(data)
  
  const option = {
    title: {
      text: ''
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c} ml'
    },
    xAxis: {
      type: 'category',
      data: dates.map(date => date.substring(5)), // 只显示月-日
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '摄入量 (ml)'
    },
    series: [
      {
        data: amounts,
        type: 'bar',
        itemStyle: {
          color: '#1890ff'
        }
      }
    ]
  }
  
  amountChart.setOption(option)
}

// 更新吃奶类型图表
function updateTypeChart() {
  const data = feedingTypeData.value
  
  const option = {
    title: {
      text: ''
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        type: 'pie',
        radius: '50%',
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  
  typeChart.setOption(option)
}

// 更新吃奶时间分布图表
function updateTimeChart() {
  const data = feedingTimeDistribution.value
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
  
  const option = {
    title: {
      text: ''
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c} 次'
    },
    xAxis: {
      type: 'category',
      data: hours
    },
    yAxis: {
      type: 'value',
      name: '次数'
    },
    series: [
      {
        data: data,
        type: 'line',
        smooth: true,
        itemStyle: {
          color: '#722ed1'
        }
      }
    ]
  }
  
  timeChart.setOption(option)
}

// 更新吃奶与排泄关联图表
function updateCorrelationChart() {
  const data = correlationData.value
  const dates = Object.keys(data)
  const amountData = dates.map(date => data[date].amount)
  const peeData = dates.map(date => data[date].pee)
  const poopData = dates.map(date => data[date].poop)
  
  const option = {
    title: {
      text: ''
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['摄入量(ml)', '小便次数', '大便次数']
    },
    xAxis: {
      type: 'category',
      data: dates.map(date => date.substring(5)), // 只显示月-日
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '摄入量(ml)',
        position: 'left'
      },
      {
        type: 'value',
        name: '次数',
        position: 'right'
      }
    ],
    series: [
      {
        name: '摄入量(ml)',
        type: 'bar',
        yAxisIndex: 0,
        data: amountData,
        itemStyle: {
          color: '#1890ff'
        }
      },
      {
        name: '小便次数',
        type: 'line',
        yAxisIndex: 1,
        data: peeData,
        itemStyle: {
          color: '#faad14'
        }
      },
      {
        name: '大便次数',
        type: 'line',
        yAxisIndex: 1,
        data: poopData,
        itemStyle: {
          color: '#52c41a'
        }
      }
    ]
  }
  
  correlationChart.setOption(option)
}
</script>

<style scoped>
.feeding-stats {
  width: 100%;
}

.chart-container {
  height: 400px;
  width: 100%;
}

.mb-4 {
  margin-bottom: 16px;
}
</style>