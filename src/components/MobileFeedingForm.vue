<template>
  <a-form
    :model="formState"
    :rules="rules"
    layout="vertical"
    @finish="onFinish"
  >
    <a-row :gutter="[16, 16]">
      <a-col :span="12">
        <a-form-item label="日期" name="date">
          <a-date-picker
            v-model:value="formState.time"
            format="YYYY-MM-DD"
            style="width: 100%"
            :popup-style="{ maxWidth: '400px' }"
            :get-popup-container="(trigger) => trigger.parentNode"
            class="mobile-date-picker"
            :disabled-date="disabledDate"
          />
        </a-form-item>
      </a-col>
      <a-col :span="12">
        <a-form-item label="时间" name="time">
          <a-time-picker
            v-model:value="formState.time"
            format="HH:mm"
            style="width: 100%"
            :popup-style="{ maxWidth: '300px' }"
            :minute-step="5"
            :get-popup-container="(trigger) => trigger.parentNode"
            :show-now="false"
            :allow-clear="false"
            inputmode="numeric"
            class="mobile-time-picker"
          />
        </a-form-item>
      </a-col>
      <a-col :span="12">
        <a-form-item label="奶量 (ml)" name="amount">
          <a-input-number
            v-model:value="formState.amount"
            :min="0"
            style="width: 100%"
            :controls="false"
            inputmode="decimal"
            placeholder="输入奶量"
          />
        </a-form-item>
      </a-col>
      <a-col :span="12">
        <a-form-item label="吃奶类型" name="type">
          <a-select
            v-model:value="formState.type"
            style="width: 100%"
            :dropdown-style="{ zIndex: 1100 }"
          >
            <a-select-option value="母乳">母乳</a-select-option>
            <a-select-option value="配方奶">配方奶</a-select-option>
            <a-select-option value="混合">混合</a-select-option>
          </a-select>
        </a-form-item>
      </a-col>
      <a-col :span="12">
        <a-form-item label="持续时间 (分钟)" name="duration">
          <a-input-number
            v-model:value="formState.duration"
            :min="0"
            style="width: 100%"
            :controls="false"
            inputmode="decimal"
            placeholder="输入分钟数"
          />
        </a-form-item>
      </a-col>
      <a-col :span="12">
        <a-form-item label="排泄类型" name="exType">
          <a-select
            v-model:value="formState.exType"
            allowClear
            style="width: 100%"
            :dropdown-style="{ zIndex: 1100 }"
          >
            <a-select-option value="小便">小便</a-select-option>
            <a-select-option value="大便">大便</a-select-option>
            <a-select-option value="大小便">大小便</a-select-option>
          </a-select>
        </a-form-item>
      </a-col>
      <a-col :span="24">
        <a-form-item
          label="颜色"
          name="color"
          v-if="formState.exType === '大便' || formState.exType === '大小便'"
        >
          <a-select
            v-model:value="formState.color"
            allowClear
            style="width: 100%"
            :dropdown-style="{ zIndex: 1100 }"
          >
            <a-select-option value="黄色">黄色</a-select-option>
            <a-select-option value="绿色">绿色</a-select-option>
            <a-select-option value="褐色">褐色</a-select-option>
            <a-select-option value="黑色">黑色</a-select-option>
            <a-select-option value="其他">其他</a-select-option>
          </a-select>
        </a-form-item>
      </a-col>
      <a-col :span="24">
        <a-form-item label="备注" name="notes">
          <a-textarea
            v-model:value="formState.notes"
            :rows="2"
            placeholder="可选备注信息"
            :maxlength="100"
            show-count
          />
        </a-form-item>
      </a-col>
    </a-row>

    <a-form-item class="submit-btn">
      <a-button type="primary" html-type="submit" block size="large">
        添加记录
      </a-button>
    </a-form-item>
  </a-form>
</template>

<script setup>
import {
  reactive,
  watch,
  defineEmits,
  defineExpose,
  defineProps,
  onMounted,
} from "vue";
import dayjs from "dayjs";

const emit = defineEmits(["add-record"]);

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({
      time: dayjs(),
      amount: 50,
      type: "混合",
      duration: 5,
      notes: "",
      exType: "",
      color: "",
    }),
  },
});

const formState = reactive({
  time: dayjs(),
  amount: 50,
  type: "混合",
  duration: 5,
  notes: "",
  exType: "",
  color: "",
});

// 初始化表单数据
onMounted(() => {
  if (props.initialData) {
    Object.assign(formState, {
      ...props.initialData,
      time: props.initialData.time ? dayjs(props.initialData.time) : dayjs(),
    });
  }
});

// 禁用未来日期
const disabledDate = (current) => {
  return current && current > dayjs().endOf("day");
};

// 当排泄类型改变时重置颜色
watch(
  () => formState.exType,
  (newType) => {
    if (newType === "小便") {
      formState.color = "";
    } else if (
      (newType === "大便" || newType === "大小便") &&
      !formState.color
    ) {
      formState.color = "黄色";
    }
  }
);

const rules = {
  time: [{ required: true, message: "请选择日期" }],
  amount: [
    { required: true, message: "请输入奶量" },
    { type: "number", min: 0, message: "奶量不能为负数" },
  ],
  type: [{ required: true, message: "请选择吃奶类型" }],
  duration: [{ type: "number", min: 0, message: "持续时间不能为负数" }],
};

function onFinish() {
  const record = {
    time: formState.time.format("YYYY-MM-DD HH:mm"),
    amount: formState.amount,
    type: formState.type,
    duration: formState.duration,
    notes: formState.notes,
    exType: formState.exType,
    color:
      formState.exType === "大便" || formState.exType === "大小便"
        ? formState.color
        : "",
  };

  emit("add-record", record);

  // 重置表单，但保留当前时间和默认值
  formState.time = dayjs();
  formState.amount = 50;
  formState.type = "混合";
  formState.duration = 5;
  formState.notes = "";
  formState.exType = "";
  formState.color = "";
}

// 暴露方法给父组件调用
function submitForm() {
  onFinish();
}

defineExpose({
  submitForm,
});
</script>

<style scoped>
/* 统一所有输入控件的高度和样式 */
:deep(.ant-picker),
:deep(.ant-input-number),
:deep(.ant-select-selector) {
  height: 48px !important;
  border-radius: 8px;
  font-size: 16px;
  width: 100%;
}

:deep(.ant-picker-input) {
  height: 100% !important;
  display: flex !important;
  align-items: center;
}

:deep(.ant-select-selector) {
  display: flex !important;
  align-items: center;
}

:deep(.ant-select-selection-item) {
  line-height: 46px !important;
  font-size: 16px;
}

:deep(.ant-input-number-input) {
  height: 46px;
  padding: 0 11px;
  font-size: 16px;
}

/* 表单标签样式 */
:deep(.ant-form-item-label > label) {
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
}

/* 表单元素间距 */
.ant-form-item {
  margin-bottom: 16px;
}

/* 提交按钮样式 */
.submit-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  margin-top: 24px;
}



:deep(.ant-picker-panel) {
  width: 100%;
  max-width: 100%;
  font-size: 16px;
}
</style>
