<template>
  <a-form :model="formState" :rules="rules" layout="vertical" @finish="onFinish">
    <a-row :gutter="16">
      <a-col :span="12">
        <a-form-item label="吃奶时间" name="time">
          <a-date-picker 
            v-model:value="formState.time" 
            :show-time="{ format: 'HH:mm' }" 
            format="YYYY-MM-DD HH:mm" 
            style="width: 100%" 
            allowClear
          />
        </a-form-item>
      </a-col>
      <a-col :span="12">
        <a-form-item label="吃奶量 (ml)" name="amount">
          <a-input-number v-model:value="formState.amount" :min="0" style="width: 100%" allowClear />
        </a-form-item>
      </a-col>
    </a-row>
    
    <a-row :gutter="16">
      <a-col :span="12">
        <a-form-item label="吃奶类型" name="type">
          <a-select v-model:value="formState.type" allowClear>
            <a-select-option value="母乳">母乳</a-select-option>
            <a-select-option value="配方奶">配方奶</a-select-option>
            <a-select-option value="混合">混合</a-select-option>
          </a-select>
        </a-form-item>
      </a-col>
      <a-col :span="12">
        <a-form-item label="持续时间 (分钟)" name="duration">
          <a-input-number v-model:value="formState.duration" :min="0" style="width: 100%" allowClear />
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
      <a-textarea v-model:value="formState.notes" :rows="2" allowClear />
    </a-form-item>
    
    <a-form-item>
      <a-button type="primary" html-type="submit">添加记录</a-button>
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