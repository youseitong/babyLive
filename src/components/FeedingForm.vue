<template>
  <a-form :model="formState" :rules="rules" layout="vertical" @finish="onFinish" class="feeding-form">
    <a-row :gutter="16">
      <a-col :span="24">
        <a-form-item label="时间" name="time">
          <a-date-picker 
            v-model:value="formState.time" 
            :show-time="{ format: 'HH:mm' }" 
            format="YYYY-MM-DD HH:mm" 
            class="form-control"
            allowClear
          />
        </a-form-item>
      </a-col>
      <a-col :span="12">
        <a-form-item label="吃奶量 (ml)" name="amount">
          <a-input-number v-model:value="formState.amount" :min="0" class="form-control" allowClear />
        </a-form-item>
      </a-col>
    </a-row>
    
    <a-row :gutter="16">
      <a-col :span="12">
        <a-form-item label="吃奶类型" name="type">
          <a-select v-model:value="formState.type" class="form-control" allowClear>
            <a-select-option value="母乳">母乳</a-select-option>
            <a-select-option value="配方奶">配方奶</a-select-option>
            <a-select-option value="混合">混合</a-select-option>
          </a-select>
        </a-form-item>
      </a-col>
      <a-col :span="12">
        <a-form-item label="持续时间 (分钟)" name="duration">
          <a-input-number v-model:value="formState.duration" :min="0" class="form-control" allowClear />
        </a-form-item>
      </a-col>
      <a-col :span="12">
        <a-form-item label="排泄类型" name="exType">
          <a-select v-model:value="formState.exType" allowClear>
            <a-select-option value="小便">小便</a-select-option>
            <a-select-option value="大便">大便</a-select-option>
            <a-select-option value="大小便">大小便</a-select-option>
          </a-select>
        </a-form-item>
      </a-col>
      <a-col :span="12">
        <a-form-item label="颜色" name="color" v-if="formState.exType === '大便' || formState.exType === '大小便'">
          <a-select v-model:value="formState.color" allowClear>
            <a-select-option value="黄色">黄色</a-select-option>
            <a-select-option value="绿色">绿色</a-select-option>
            <a-select-option value="褐色">褐色</a-select-option>
            <a-select-option value="黑色">黑色</a-select-option>
            <a-select-option value="其他">其他</a-select-option>
          </a-select>
        </a-form-item>
      </a-col>
    </a-row>
    
    <a-form-item label="备注" name="notes">
      <a-textarea v-model:value="formState.notes" :rows="2" class="form-control" allowClear />
    </a-form-item>
    
    <a-form-item class="form-actions">
      <a-button type="primary" html-type="submit" size="large" block>保存记录</a-button>
    </a-form-item>
  </a-form>
</template>

<script setup>
import { reactive, watch, defineExpose } from 'vue'
import dayjs from 'dayjs'

const emit = defineEmits(['add-record'])

const formState = reactive({
  time: dayjs(),
  amount:50,
  type: '混合',
  duration: 5,
  notes: '',
  exType: '',
  color: ''
})

// 当排泄类型改变时重置颜色
watch(() => formState.exType, (newType) => {
  if (newType === '小便') {
    formState.color = ''
  } else if ((newType === '大便' || newType === '大小便') && !formState.color) {
    formState.color = '黄色'
  }
})

const rules = {
  time: [
    { required: true, message: '请选择吃奶时间' }
  ],
  amount: [
    { required: true, message: '请输入吃奶量' }
  ],
  type: [
    { required: true, message: '请选择吃奶类型' }
  ]
}

function onFinish() {
  const record = {
    time: formState.time.format('YYYY-MM-DD HH:mm'),
    amount: formState.amount,
    type: formState.type,
    duration: formState.duration,
    notes: formState.notes,
    exType: formState.exType,
    color: (formState.exType === '大便' || formState.exType === '大小便') ? formState.color : ''
  }
  
  emit('add-record', record)
  
  // 重置表单，但保留当前时间和默认值
  formState.time = dayjs()
  formState.amount = 50
  formState.type = '混合'
  formState.duration = 5
  formState.notes = ''
  formState.exType = ''
  formState.color = ''
}

// 暴露方法给父组件调用
function submitForm() {
  onFinish()
}

defineExpose({
  submitForm
})
</script>

<style scoped>
.feeding-form {
  padding: 4px;
}

.form-control {
  width: 100%;
  height: 40px;
}

:deep(.ant-input-number-input) {
  height: 100%;
}

:deep(.ant-picker) {
  width: 100%;
  height: 40px;
}

:deep(.ant-select-selector) {
  height: 40px !important;
  display: flex;
  align-items: center;
}

:deep(.ant-select-selection-item) {
  line-height: 38px !important;
}

:deep(.ant-input) {
  min-height: 40px;
  resize: none;
}

:deep(.ant-form-item) {
  margin-bottom: 16px;
}

:deep(.ant-form-item-label) {
  padding: 0 0 4px;
}

:deep(.ant-form-item-label > label) {
  font-weight: 500;
}

.form-actions {
  margin-top: 24px;
}
</style>

<style scoped>
/* 移动端时间选择器样式 */
.mobile-date-picker,
.mobile-time-picker {
  --antd-arrow-background: #fff;
}

:deep(.ant-picker-panel) {
  width: 100%;
  max-width: 100%;
  font-size: 16px;
}

:deep(.mobile-time-picker .ant-picker-panel) {
  width: 100%;
  max-width: 100%;
}

:deep(.ant-picker-dropdown) {
  width: 90%;
  max-width: 400px;
  left: 50% !important;
  transform: translateX(-50%);
  z-index: 1100;
  position: fixed;
  top: 50%;
  transform: translate(-50%, -50%);
}

:deep(.ant-picker-time-panel-column) {
  width: 100%;
  text-align: center;
  overflow-y: auto;
  max-height: 200px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

:deep(.ant-picker-time-panel-column)::-webkit-scrollbar {
  display: none;
}

:deep(.ant-picker-time-panel-cell-inner) {
  padding: 8px 0;
  font-size: 16px;
}

:deep(.ant-picker-time-panel-cell-selected .ant-picker-time-panel-cell-inner) {
  background: #e6f7ff;
  font-weight: normal;
}
</style>