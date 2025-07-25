import { defineStore } from "pinia";
import { ref, computed } from "vue";
import dayjs from "dayjs";
import { API_URL } from "../config";
import api from "../utils/api";

// const API_URL = 'http://localhost:3000/api';

export const useGrowthStore = defineStore("growth", () => {
  // 状态
  const growthRecords = ref([]);
  const isLoading = ref(false);
  const error = ref(null);

  // 初始化加载数据
  async function loadRecords() {
    isLoading.value = true;
    error.value = null;

    try {
      // 使用api.get替代fetch
      const data = await api.get("/growth");
      growthRecords.value = data;
    } catch (err) {
      console.error("加载数据错误:", err);
      error.value = err.message;
      // 如果API请求失败，尝试从localStorage加载
      const localData = localStorage.getItem("growthRecords");
      if (localData) {
        try {
          growthRecords.value = JSON.parse(localData);
          // 成功从本地存储加载数据后，清除错误
          error.value = null;
        } catch (parseErr) {
          console.error("解析本地数据错误:", parseErr);
          // 如果解析失败，确保 growthRecords 是一个空数组
          growthRecords.value = [];
        }
      } else {
        // 确保 growthRecords 是一个空数组
        growthRecords.value = [];
      }
    } finally {
      isLoading.value = false;
    }
  }

  // 计算属性
  const sortedRecords = computed(() => {
    return [...growthRecords.value].sort((a, b) => {
      return dayjs(b.time).valueOf() - dayjs(a.time).valueOf();
    });
  });

  const todayRecords = computed(() => {
    const today = dayjs().format("YYYY-MM-DD");
    return growthRecords.value.filter((record) => {
      return dayjs(record.time).format("YYYY-MM-DD") === today;
    });
  });

  const latestRecord = computed(() => {
    if (sortedRecords.value.length > 0) {
      return sortedRecords.value[0];
    }
    return null;
  });

  // 添加记录
  async function addRecord(record) {
    try {
      // 使用api.post替代fetch
      const savedRecord = await api.post("/growth", record);
      growthRecords.value.push(savedRecord);

      // 保存到localStorage作为备份
      localStorage.setItem(
        "growthRecords",
        JSON.stringify(growthRecords.value)
      );

      return savedRecord;
    } catch (err) {
      console.error("添加记录错误:", err);
      error.value = err.message;

      // 如果API请求失败，仍然添加到本地状态
      const newRecord = {
        ...record,
        id: Date.now().toString(),
      };
      growthRecords.value.push(newRecord);

      // 保存到localStorage
      localStorage.setItem(
        "growthRecords",
        JSON.stringify(growthRecords.value)
      );

      return newRecord;
    }
  }

  // 更新记录
  async function updateRecord(id, updatedRecord) {
    try {
      // 使用api.put替代fetch
      await api.put(`/growth/${id}`, updatedRecord);

      // 更新本地状态
      const index = growthRecords.value.findIndex((r) => r.id === id);
      if (index !== -1) {
        growthRecords.value[index] = { ...updatedRecord, id };
      }

      // 保存到localStorage作为备份
      localStorage.setItem(
        "growthRecords",
        JSON.stringify(growthRecords.value)
      );

      return { ...updatedRecord, id };
    } catch (err) {
      console.error("更新记录错误:", err);
      error.value = err.message;

      // 如果API请求失败，仍然更新本地状态
      const index = growthRecords.value.findIndex((r) => r.id === id);
      if (index !== -1) {
        growthRecords.value[index] = { ...updatedRecord, id };
      }

      // 保存到localStorage
      localStorage.setItem(
        "growthRecords",
        JSON.stringify(growthRecords.value)
      );

      return { ...updatedRecord, id };
    }
  }

  // 删除记录
  async function deleteRecord(id) {
    try {
      // 使用api.delete替代fetch
      await api.delete(`/growth/${id}`);

      // 更新本地状态
      growthRecords.value = growthRecords.value.filter((r) => r.id !== id);

      // 保存到localStorage作为备份
      localStorage.setItem(
        "growthRecords",
        JSON.stringify(growthRecords.value)
      );

      return { id };
    } catch (err) {
      console.error("删除记录错误:", err);
      error.value = err.message;

      // 如果API请求失败，仍然从本地状态删除
      growthRecords.value = growthRecords.value.filter((r) => r.id !== id);

      // 保存到localStorage
      localStorage.setItem(
        "growthRecords",
        JSON.stringify(growthRecords.value)
      );

      return { id };
    }
  }

  // 初始加载数据
  loadRecords();

  return {
    growthRecords,
    isLoading,
    error,
    sortedRecords,
    todayRecords,
    latestRecord,
    loadRecords,
    addRecord,
    updateRecord,
    deleteRecord,
  };
});
