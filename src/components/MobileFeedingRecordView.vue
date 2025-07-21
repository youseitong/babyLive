<template>
  <div class="mobile-feeding-record-view">
    <!-- 返回按钮 -->
    <div class="back-button-container">
      <a-button type="link" @click="router.push('/mobile')" class="back-button">
        <arrow-left-outlined /> 返回
      </a-button>
    </div>
    <!-- 顶部筛选栏 -->
    <div class="filter-bar">
      <a-segmented
        v-model:value="timeFilter"
        :options="[
          { label: '今天', value: 'today' },
          { label: '本周', value: 'week' },
          { label: '本月', value: 'month' },
        ]"
        block
      />
      <a-button type="link" @click="showDatePicker" class="date-filter-btn">
        <calendar-outlined /> 自定义
      </a-button>
    </div>

    <!-- 日期选择器弹窗 -->
    <a-modal
      v-model:open="datePickerVisible"
      title="选择日期范围"
      :footer="null"
      :width="'90%'"
      :mask-closable="true"
    >
      <a-range-picker
        v-model:value="dateRange"
        style="width: 100%"
        :disabled-date="disabledDate"
        @change="handleDateRangeChange"
      />
      <div style="margin-top: 16px; text-align: center">
        <a-button type="primary" @click="applyDateFilter">确定</a-button>
      </div>
    </a-modal>

    <!-- 摄入量统计卡片 -->
    <a-card class="stat-card">
      <div class="stat-header">
        <div class="stat-title">{{ periodLabel }}摄入总量</div>
        <a-tag color="blue">{{ dateRangeLabel }}</a-tag>
      </div>
      <div class="stat-value">{{ totalAmount }} ml</div>
      <div class="stat-details">
        <div class="stat-detail-item">
          <span class="detail-label">平均每次:</span>
          <span class="detail-value">{{ averageAmount }} ml</span>
        </div>
        <div class="stat-detail-item">
          <span class="detail-label">总次数:</span>
          <span class="detail-value">{{ feedingCount }} 次</span>
        </div>
      </div>
    </a-card>

    <!-- 类型分布卡片 -->
    <a-card class="stat-card">
      <div class="stat-header">
        <div class="stat-title">吃奶类型分布</div>
      </div>
      <div class="type-distribution">
        <div
          class="type-item"
          v-for="(count, type) in typeDistribution"
          :key="type"
        >
          <a-tag :color="getTypeColor(type)" class="type-tag">{{ type }}</a-tag>
          <div class="type-count">{{ count }} 次</div>
          <div class="type-bar-container">
            <div
              class="type-bar"
              :style="{
                width: `${(count / feedingCount) * 100}%`,
                backgroundColor: getTypeBarColor(type),
              }"
            ></div>
          </div>
        </div>
      </div>
    </a-card>

    <!-- 吃奶时间分布图表 -->
    <a-card class="stat-card">
      <div class="stat-header">
        <div class="stat-title">吃奶时间分布</div>
      </div>
      <div ref="timeChartContainer" class="chart-container"></div>
    </a-card>

    <!-- 吃奶与排泄关联分析图表 -->
    <a-card class="stat-card">
      <div class="stat-header">
        <div class="stat-title">吃奶与排泄关联分析</div>
      </div>
      <div ref="correlationChartContainer" class="chart-container"></div>
    </a-card>

    <!-- 记录列表 -->
    <a-divider>吃奶记录列表</a-divider>

    <div class="record-list">
      <a-empty v-if="filteredRecords.length === 0" description="暂无记录" />
      <a-list
        v-else
        :data-source="filteredRecords"
        :pagination="{ pageSize: 10, size: 'small' }"
      >
        <template #renderItem="{ item }">
          <a-list-item>
            <a-card style="width: 100%">
              <div class="record-header">
                <div class="record-time">{{ formatTime(item.time) }}</div>
                <a-tag :color="getTypeColor(item.type)">{{ item.type }}</a-tag>
              </div>

              <div class="record-details">
                <div class="record-detail-item">
                  <span class="detail-label">吃奶量:</span>
                  <span class="detail-value">{{ item.amount }} ml</span>
                </div>
                <div class="record-detail-item">
                  <span class="detail-label">持续时间:</span>
                  <span class="detail-value">{{ item.duration }} 分钟</span>
                </div>
                <div v-if="item.notes" class="record-detail-item">
                  <span class="detail-label">备注:</span>
                  <span class="detail-value">{{ item.notes }}</span>
                </div>
              </div>

              <div class="record-actions" v-if="authStore.isAdmin">
                <a-button type="link" @click="editRecord(item)">
                  <template #icon><edit-outlined /></template>
                  编辑
                </a-button>
                <a-popconfirm
                  title="确定要删除这条记录吗？"
                  ok-text="是"
                  cancel-text="否"
                  @confirm="deleteRecord(item.id)"
                >
                  <a-button type="link" danger>
                    <template #icon><delete-outlined /></template>
                    删除
                  </a-button>
                </a-popconfirm>
              </div>
            </a-card>
          </a-list-item>
        </template>
      </a-list>
    </div>

    <!-- 编辑记录弹窗 -->
    <a-modal
      v-model:open="editModalVisible"
      title="编辑吃奶记录"
      :width="'90%'"
      :body-style="{ maxHeight: '80vh', overflowY: 'auto' }"
      :maskClosable="false"
      :footer="null"
      :keyboard="true"
      :focusTriggerAfterClose="true"
    >
      <mobile-feeding-form
        ref="editFormRef"
        :initial-data="editForm"
        @add-record="updateRecord"
      />
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import dayjs from 'dayjs';
import { message } from 'ant-design-vue';
import { EditOutlined, DeleteOutlined, CalendarOutlined, ArrowLeftOutlined } from '@ant-design/icons-vue';
import { useFeedingStore } from '../stores/feeding';
import { useExcretionStore } from '../stores/excretion';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import MobileFeedingForm from './MobileFeedingForm.vue';
import * as echarts from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// 注册必要的组件
echarts.use([
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  BarChart,
  LineChart,
  CanvasRenderer,
]);

const router = useRouter();
const feedingStore = useFeedingStore();
const excretionStore = useExcretionStore();
const authStore = useAuthStore();

// 时间筛选
const timeFilter = ref("today");
const datePickerVisible = ref(false);
const dateRange = ref([dayjs().subtract(7, "day"), dayjs()]);
const customDateFilterActive = ref(false);

// 编辑相关
const editModalVisible = ref(false);
const editFormRef = ref(null);
const editForm = ref({});

// 图表容器引用
const timeChartContainer = ref(null);
const correlationChartContainer = ref(null);

// 图表实例
let timeChart = null;
let correlationChart = null;

// 禁用未来日期
const disabledDate = (current) => {
  return current && current > dayjs().endOf("day");
};

// 根据筛选条件获取记录
const filteredRecords = computed(() => {
  if (
    !feedingStore.feedingRecords ||
    !Array.isArray(feedingStore.feedingRecords)
  ) {
    return [];
  }

  let records = [...feedingStore.feedingRecords].filter(
    (record) => !record.deleted && !record.isExcretionOnly
  );

  // 根据时间筛选
  if (customDateFilterActive.value) {
    const startDate = dayjs(dateRange.value[0]).startOf("day");
    const endDate = dayjs(dateRange.value[1]).endOf("day");

    records = records.filter((record) => {
      const recordDate = dayjs(record.time);
      return recordDate >= startDate && recordDate <= endDate;
    });
  } else if (timeFilter.value === "today") {
    const today = dayjs().format("YYYY-MM-DD");
    records = records.filter((record) => {
      return dayjs(record.time).format("YYYY-MM-DD") === today;
    });
  } else if (timeFilter.value === "week") {
    const startOfWeek = dayjs().subtract(6, "day").startOf("day");
    records = records.filter((record) => {
      return dayjs(record.time) >= startOfWeek;
    });
  } else if (timeFilter.value === "month") {
    const startOfMonth = dayjs().subtract(29, "day").startOf("day");
    records = records.filter((record) => {
      return dayjs(record.time) >= startOfMonth;
    });
  }

  // 按时间排序
  return records.sort(
    (a, b) => dayjs(b.time).valueOf() - dayjs(a.time).valueOf()
  );
});

// 获取相同时间范围内的排泄记录
const filteredExcretionRecords = computed(() => {
  if (
    !excretionStore.excretionRecords ||
    !Array.isArray(excretionStore.excretionRecords)
  ) {
    return [];
  }

  let records = [...excretionStore.excretionRecords].filter(
    (record) => !record.deleted
  );

  // 根据时间筛选
  if (customDateFilterActive.value) {
    const startDate = dayjs(dateRange.value[0]).startOf("day");
    const endDate = dayjs(dateRange.value[1]).endOf("day");

    records = records.filter((record) => {
      const recordDate = dayjs(record.time);
      return recordDate >= startDate && recordDate <= endDate;
    });
  } else if (timeFilter.value === "today") {
    const today = dayjs().format("YYYY-MM-DD");
    records = records.filter((record) => {
      return dayjs(record.time).format("YYYY-MM-DD") === today;
    });
  } else if (timeFilter.value === "week") {
    const startOfWeek = dayjs().subtract(6, "day").startOf("day");
    records = records.filter((record) => {
      return dayjs(record.time) >= startOfWeek;
    });
  } else if (timeFilter.value === "month") {
    const startOfMonth = dayjs().subtract(29, "day").startOf("day");
    records = records.filter((record) => {
      return dayjs(record.time) >= startOfMonth;
    });
  }

  return records;
});

// 计算统计数据
const totalAmount = computed(() => {
  return filteredRecords.value.reduce(
    (sum, record) => sum + (parseInt(record.amount) || 0),
    0
  );
});

const averageAmount = computed(() => {
  if (filteredRecords.value.length === 0) return 0;
  return Math.round(totalAmount.value / filteredRecords.value.length);
});

const feedingCount = computed(() => {
  return filteredRecords.value.length;
});

const typeDistribution = computed(() => {
  const distribution = {
    母乳: 0,
    配方奶: 0,
    混合: 0,
  };

  filteredRecords.value.forEach((record) => {
    if (distribution[record.type] !== undefined) {
      distribution[record.type]++;
    }
  });

  return distribution;
});

// 计算吃奶时间分布数据
const feedingTimeDistribution = computed(() => {
  const hourlyCount = Array(24).fill(0);

  filteredRecords.value.forEach((record) => {
    const hour = dayjs(record.time).hour();
    hourlyCount[hour]++;
  });

  return hourlyCount;
});

// 计算吃奶与排泄关联数据
const correlationData = computed(() => {
  // 按日期分组计算
  const dailyData = {};

  // 初始化日期范围内的所有日期
  let startDate, endDate;
  if (customDateFilterActive.value) {
    startDate = dayjs(dateRange.value[0]);
    endDate = dayjs(dateRange.value[1]);
  } else if (timeFilter.value === "today") {
    startDate = dayjs().startOf("day");
    endDate = dayjs().endOf("day");
  } else if (timeFilter.value === "week") {
    startDate = dayjs().subtract(6, "day");
    endDate = dayjs();
  } else if (timeFilter.value === "month") {
    startDate = dayjs().subtract(29, "day");
    endDate = dayjs();
  }

  for (let d = startDate; d <= endDate; d = d.add(1, "day")) {
    const dateStr = d.format("YYYY-MM-DD");
    dailyData[dateStr] = {
      amount: 0,
      pee: 0,
      poop: 0,
    };
  }

  // 累加每日摄入量
  filteredRecords.value.forEach((record) => {
    const dateStr = dayjs(record.time).format("YYYY-MM-DD");
    if (dailyData[dateStr] !== undefined) {
      dailyData[dateStr].amount += record.amount;
    }
  });

  // 累加每日排泄次数
  filteredExcretionRecords.value.forEach((record) => {
    const dateStr = dayjs(record.time).format("YYYY-MM-DD");
    if (dailyData[dateStr] !== undefined) {
      if (record.type === "小便") dailyData[dateStr].pee++;
      if (record.type === "大便") dailyData[dateStr].poop++;
      if (record.type === "大小便") {
        dailyData[dateStr].pee++;
        dailyData[dateStr].poop++;
      }
    }
  });

  return dailyData;
});

const periodLabel = computed(() => {
  if (customDateFilterActive.value) return "选定期间";
  if (timeFilter.value === "today") return "今日";
  if (timeFilter.value === "week") return "本周";
  if (timeFilter.value === "month") return "本月";
  return "";
});

const dateRangeLabel = computed(() => {
  if (customDateFilterActive.value) {
    return `${dayjs(dateRange.value[0]).format("MM-DD")} 至 ${dayjs(
      dateRange.value[1]
    ).format("MM-DD")}`;
  }
  if (timeFilter.value === "today") return dayjs().format("YYYY-MM-DD");
  if (timeFilter.value === "week")
    return `${dayjs().subtract(6, "day").format("MM-DD")} 至 ${dayjs().format(
      "MM-DD"
    )}`;
  if (timeFilter.value === "month")
    return `${dayjs().subtract(29, "day").format("MM-DD")} 至 ${dayjs().format(
      "MM-DD"
    )}`;
  return "";
});

// 方法
function showDatePicker() {
  datePickerVisible.value = true;
}

function handleDateRangeChange(dates) {
  if (dates && dates.length === 2) {
    dateRange.value = dates;
  }
}

function applyDateFilter() {
  if (dateRange.value && dateRange.value.length === 2) {
    customDateFilterActive.value = true;
    datePickerVisible.value = false;
  } else {
    message.error("请选择有效的日期范围");
  }
}

function getTypeColor(type) {
  const colors = {
    母乳: "pink",
    配方奶: "blue",
    混合: "purple",
  };
  return colors[type] || "default";
}

function getTypeBarColor(type) {
  const colors = {
    母乳: "#eb2f96",
    配方奶: "#1890ff",
    混合: "#722ed1",
  };
  return colors[type] || "#d9d9d9";
}

function formatTime(time) {
  return dayjs(time).format("MM-DD HH:mm");
}

function editRecord(record) {
  editForm.value = {
    id: record.id,
    time: dayjs(record.time),
    amount: record.amount || 50,
    type: record.type || "混合",
    duration: record.duration || 5,
    notes: record.notes || "",
  };
  editModalVisible.value = true;
}

function updateRecord(record) {
  const recordData = {
    ...record,
    id: editForm.value.id,
  };

  feedingStore
    .updateRecord(recordData.id, recordData)
    .then(() => {
      message.success("记录更新成功");
      editModalVisible.value = false;
    })
    .catch((error) => {
      message.error("更新记录失败: " + error.message);
    });
}

function deleteRecord(id) {
  feedingStore
    .deleteRecord(id)
    .then(() => {
      message.success("记录删除成功");
    })
    .catch((error) => {
      message.error("删除记录失败: " + error.message);
    });
}

// 更新吃奶时间分布图表
function updateTimeChart() {
  if (!timeChart) return;

  const data = feedingTimeDistribution.value;
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

  const option = {
    title: {
      text: "",
    },
    tooltip: {
      trigger: "axis",
      formatter: "{b}: {c} 次",
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: hours,
      axisLabel: {
        interval: 3,
        fontSize: 10,
      },
    },
    yAxis: {
      type: "value",
      name: "次数",
      nameTextStyle: {
        fontSize: 10,
      },
      axisLabel: {
        fontSize: 10,
      },
    },
    series: [
      {
        data: data,
        type: "line",
        smooth: true,
        itemStyle: {
          color: "#722ed1",
        },
      },
    ],
  };

  timeChart.setOption(option);
}

// 更新吃奶与排泄关联图表
function updateCorrelationChart() {
  if (!correlationChart) return;

  const data = correlationData.value;
  const dates = Object.keys(data);
  const amountData = dates.map((date) => data[date].amount);
  const peeData = dates.map((date) => data[date].pee);
  const poopData = dates.map((date) => data[date].poop);

  const option = {
    title: {
      text: "",
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    legend: {
      data: ["摄入量(ml)", "小便次数", "大便次数"],
      textStyle: {
        fontSize: 10,
      },
      bottom: 0,
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: dates.map((date) => date.substring(5)), // 只显示月-日
      axisLabel: {
        rotate: 45,
        fontSize: 10,
      },
    },
    yAxis: [
      {
        type: "value",
        name: "摄入量(ml)",
        position: "left",
        nameTextStyle: {
          fontSize: 10,
        },
        axisLabel: {
          fontSize: 10,
        },
      },
      {
        type: "value",
        name: "次数",
        position: "right",
        nameTextStyle: {
          fontSize: 10,
        },
        axisLabel: {
          fontSize: 10,
        },
      },
    ],
    series: [
      {
        name: "摄入量(ml)",
        type: "bar",
        yAxisIndex: 0,
        data: amountData,
        itemStyle: {
          color: "#1890ff",
        },
      },
      {
        name: "小便次数",
        type: "line",
        yAxisIndex: 1,
        data: peeData,
        itemStyle: {
          color: "#faad14",
        },
      },
      {
        name: "大便次数",
        type: "line",
        yAxisIndex: 1,
        data: poopData,
        itemStyle: {
          color: "#52c41a",
        },
      },
    ],
  };

  correlationChart.setOption(option);
}

// 初始化图表并监听数据变化
onMounted(() => {
  // 加载数据
  console.log("开始加载数据...");
  feedingStore
    .loadRecords()
    .then(() => {
      console.log("数据加载完成:", feedingStore.feedingRecords);
    })
    .catch((err) => {
      console.error("数据加载失败:", err);
    });
  excretionStore.loadRecords();

  // 初始化图表
  timeChart = echarts.init(timeChartContainer.value);
  correlationChart = echarts.init(correlationChartContainer.value);

  // 更新图表
  updateTimeChart();
  updateCorrelationChart();

  // 监听窗口大小变化，调整图表大小
  window.addEventListener("resize", () => {
    timeChart.resize();
    correlationChart.resize();
  });
});
// 监听数据变化，更新图表
watch(
  [
    filteredRecords,
    filteredExcretionRecords,
    timeFilter,
    customDateFilterActive,
  ],
  () => {
    updateTimeChart();
    updateCorrelationChart();
  },
  { deep: true }
);
</script>

<style scoped>
.mobile-feeding-record-view {
  padding: 10px;
}

.filter-bar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.date-filter-btn {
  margin-left: 8px;
  font-size: 14px;
}

.stat-card {
  margin-bottom: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.stat-title {
  font-weight: bold;
  font-size: 16px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 10px;
}

.stat-details {
  display: flex;
  justify-content: space-between;
}

.stat-detail-item {
  display: flex;
  flex-direction: column;
}

.detail-label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}

.detail-value {
  font-size: 16px;
  font-weight: 500;
}

.type-distribution {
  margin-top: 10px;
}

.type-item {
  margin-bottom: 12px;
}

.type-tag {
  margin-right: 8px;
  font-size: 14px;
}

.type-count {
  display: inline-block;
  margin-right: 8px;
  font-weight: 500;
}

.type-bar-container {
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  margin-top: 6px;
}

.type-bar {
  height: 100%;
  border-radius: 4px;
}

.record-list {
  margin-bottom: 20px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.record-time {
  font-weight: bold;
}

.record-details {
  margin: 10px 0;
}

.record-detail-item {
  display: flex;
  margin-bottom: 5px;
}

.record-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
  border-top: 1px solid #f0f0f0;
  padding-top: 10px;
}

.chart-container {
  height: 250px;
  width: 100%;
}

/* 适配移动端的样式 */
:deep(.ant-picker),
:deep(.ant-input-number),
:deep(.ant-select-selector) {
  height: 48px !important;
  border-radius: 8px;
  font-size: 16px;
}

:deep(.ant-btn-lg) {
  height: 48px;
  font-size: 16px;
}

:deep(.ant-segmented) {
  background-color: #f5f5f5;
  padding: 4px;
  border-radius: 8px;
}

:deep(.ant-segmented-item) {
  height: 36px;
  line-height: 36px;
  transition: all 0.3s;
}

:deep(.ant-segmented-item-selected) {
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.back-button-container {
  margin-bottom: 12px;
}

.back-button {
  padding-left: 0;
  font-size: 16px;
}
</style>
