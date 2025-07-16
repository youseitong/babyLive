import { defineStore } from "pinia";
import { ref, computed } from "vue";
import dayjs from "dayjs";
import { API_URL } from "../config";

// const API_URL = 'http://localhost:3000/api';

export const useExcretionStore = defineStore("excretion", () => {
  // 状态
  const excretionRecords = ref([]);
  const isLoading = ref(false);
  const error = ref(null);

  // 初始化加载数据
    async function loadRecords() {
    isLoading.value = true;
    error.value = null;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/excretion`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("加载数据失败");

      const data = await response.json();
      excretionRecords.value = data;
    } catch (err) {
      // ... existing code ...
      console.error("加载数据错误:", err);
      error.value = err.message;
      // 如果API请求失败，尝试从localStorage加载
      const localData = localStorage.getItem("excretionRecords");
      if (localData) {
        excretionRecords.value = JSON.parse(localData);
      }
    } finally {
      isLoading.value = false;
    }
  }

const sortedRecords = computed(() => {
  return [...excretionRecords.value]
    .filter(record => !record.deleted) // 过滤掉已删除的记录
    .sort((a, b) => {
      return dayjs(b.time).valueOf() - dayjs(a.time).valueOf();
    });
});

  const todayRecords = computed(() => {
    const today = dayjs().format("YYYY-MM-DD");
    return excretionRecords.value.filter((record) => {
      return dayjs(record.time).format("YYYY-MM-DD") === today;
    });
  });

  const todayStats = computed(() => {
    const stats = {
      pee: 0,
      poop: 0,
    };

    todayRecords.value.forEach((record) => {
      if (record.type === "小便") stats.pee++;
      if (record.type === "大便") stats.poop++;
      if (record.type === "大小便") {
        stats.pee++;
        stats.poop++;
      }
    });

    return stats;
  });

  const weeklyStats = computed(() => {
    const stats = {};
    const now = dayjs();

    // 初始化最近7天的数据结构
    for (let i = 6; i >= 0; i--) {
      const date = now.subtract(i, "day").format("YYYY-MM-DD");
      stats[date] = {
        pee: 0,
        poop: 0,
      };
    }

    // 填充数据
    excretionRecords.value.forEach((record) => {
      const date = dayjs(record.time).format("YYYY-MM-DD");
      if (stats[date] !== undefined) {
        if (record.type === "小便") stats[date].pee++;
        if (record.type === "大便") stats[date].poop++;
        if (record.type === "大小便") {
          stats[date].pee++;
          stats[date].poop++;
        }
      }
    });

    return stats;
  });

  async function addRecord(record) {
    isLoading.value = true;
    error.value = null;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/excretion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(record),
      });

      if (!response.ok) throw new Error("添加记录失败");

      const savedRecord = await response.json();
      excretionRecords.value.push(savedRecord);
    } catch (err) {
      console.error("添加记录错误:", err);
      error.value = err.message;

      // 如果API请求失败，保存到localStorage
      record.id = Date.now().toString();
      excretionRecords.value.push(record);
      saveToLocalStorage();
    } finally {
      isLoading.value = false;
    }
  }

  async function updateRecord(id, updatedRecord) {
    isLoading.value = true;
    error.value = null;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/excretion/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedRecord),
      });

      if (!response.ok) throw new Error("更新记录失败");

      const index = excretionRecords.value.findIndex(
        (record) => record.id === id
      );
      if (index !== -1) {
        excretionRecords.value[index] = {
          ...excretionRecords.value[index],
          ...updatedRecord,
        };
      }
    } catch (err) {
      console.error("更新记录错误:", err);
      error.value = err.message;

      // 如果API请求失败，更新localStorage
      const index = excretionRecords.value.findIndex(
        (record) => record.id === id
      );
      if (index !== -1) {
        excretionRecords.value[index] = {
          ...excretionRecords.value[index],
          ...updatedRecord,
        };
        saveToLocalStorage();
      }
    } finally {
      isLoading.value = false;
    }
  }

 async function deleteRecord(id) {
  isLoading.value = true;
  error.value = null;

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/excretion/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("删除记录失败");

    // 从本地数组中移除记录，保持与后端一致
    const index = excretionRecords.value.findIndex(
      (record) => record.id === id
    );
    if (index !== -1) {
      excretionRecords.value.splice(index, 1);
    }
  } catch (err) {
    console.error("删除记录错误:", err);
    error.value = err.message;

    // 如果 API 请求失败，在本地标记为已删除
    const index = excretionRecords.value.findIndex(
      (record) => record.id === id
    );
    if (index !== -1) {
      // 不实际删除，只在本地标记
      excretionRecords.value[index].deleted = 1;
      saveToLocalStorage();
    }
  } finally {
    isLoading.value = false;
  }
}

  function saveToLocalStorage() {
    localStorage.setItem(
      "excretionRecords",
      JSON.stringify(excretionRecords.value)
    );
  }

  // 初始加载数据
  loadRecords();

  return {
    excretionRecords,
    isLoading,
    error,
    sortedRecords,
    todayRecords,
    todayStats,
    weeklyStats,
    loadRecords,
    addRecord,
    updateRecord,
    deleteRecord,
  };
});
