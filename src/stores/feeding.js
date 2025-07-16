import { defineStore } from "pinia";
import { ref, computed } from "vue";
import dayjs from "dayjs";
import { API_URL } from "../config";

// const API_URL = 'http://localhost:3000/api';

export const useFeedingStore = defineStore("feeding", () => {
  // 状态
  const feedingRecords = ref([]);
  const isLoading = ref(false);
  const error = ref(null);

  // 初始化加载数据
  async function loadRecords() {
    isLoading.value = true;
    error.value = null;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/feeding`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("加载数据失败");

      const data = await response.json();
      feedingRecords.value = data;
    } catch (err) {
      console.error("加载数据错误:", err);
      error.value = err.message;
      // 如果API请求失败，尝试从localStorage加载
      const localData = localStorage.getItem("feedingRecords");
      if (localData) {
        feedingRecords.value = JSON.parse(localData);
      }
    } finally {
      isLoading.value = false;
    }
  }

  // 计算属性
 const sortedRecords = computed(() => {
  return [...feedingRecords.value]
    .filter(record => !record.deleted) // 过滤掉已删除的记录
    .sort((a, b) => {
      return dayjs(b.time).valueOf() - dayjs(a.time).valueOf();
    });
});

  const todayRecords = computed(() => {
    const today = dayjs().format("YYYY-MM-DD");
    return feedingRecords.value.filter((record) => {
      return dayjs(record.time).format("YYYY-MM-DD") === today;
    });
  });

  const todayTotalAmount = computed(() => {
    return todayRecords.value.reduce((sum, record) => sum + record.amount, 0);
  });

  // 在现有的计算属性后添加

  const todayFeedingCount = computed(() => {
    return todayRecords.value.length;
  });

  const todayAverageAmount = computed(() => {
    if (todayRecords.value.length === 0) return 0;
    return Math.round(todayTotalAmount.value / todayRecords.value.length);
  });

  const todayFeedingTypes = computed(() => {
    const types = {
      母乳: 0,
      配方奶: 0,
      混合: 0,
    };

    todayRecords.value.forEach((record) => {
      if (types[record.type] !== undefined) {
        types[record.type]++;
      }
    });

    return types;
  });

  const monthlyStats = computed(() => {
    const stats = {};
    const now = dayjs();
    const startOfMonth = now.startOf("month");
    const daysInMonth = now.daysInMonth();

    for (let i = 0; i < daysInMonth; i++) {
      const date = startOfMonth.add(i, "day").format("YYYY-MM-DD");
      stats[date] = 0;
    }

    feedingRecords.value.forEach((record) => {
      const date = dayjs(record.time).format("YYYY-MM-DD");
      if (stats[date] !== undefined) {
        stats[date] += record.amount;
      }
    });

    return stats;
  });

  const weeklyStats = computed(() => {
    const stats = {};
    const now = dayjs();

    for (let i = 6; i >= 0; i--) {
      const date = now.subtract(i, "day").format("YYYY-MM-DD");
      stats[date] = 0;
    }

    feedingRecords.value.forEach((record) => {
      const date = dayjs(record.time).format("YYYY-MM-DD");
      if (stats[date] !== undefined) {
        stats[date] += record.amount;
      }
    });

    return stats;
  });

  // 动作
  async function addRecord(record) {
    isLoading.value = true;
    error.value = null;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/feeding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(record),
      });

      if (!response.ok) throw new Error("添加记录失败");

      const savedRecord = await response.json();
      feedingRecords.value.push(savedRecord);
    } catch (err) {
      console.error("添加记录错误:", err);
      error.value = err.message;

      // 如果API请求失败，保存到localStorage
      record.id = Date.now().toString();
      feedingRecords.value.push(record);
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
      const response = await fetch(`${API_URL}/feeding/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedRecord),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "更新记录失败");
      }

      const index = feedingRecords.value.findIndex(
        (record) => record.id === id
      );
      if (index !== -1) {
        feedingRecords.value[index] = {
          ...feedingRecords.value[index],
          ...updatedRecord,
        };
      }
    } catch (err) {
      console.error("更新记录错误:", err);
      error.value = err.message;

      // 如果API请求失败，更新localStorage
      const index = feedingRecords.value.findIndex(
        (record) => record.id === id
      );
      if (index !== -1) {
        feedingRecords.value[index] = {
          ...feedingRecords.value[index],
          ...updatedRecord,
        };
        saveToLocalStorage();
      }
      throw err;
    } finally {
      isLoading.value = false;
    }
  }
 async function deleteRecord(id) {
  isLoading.value = true;
  error.value = null;

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/feeding/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("删除记录失败");

    // 从本地数组中移除记录，保持与后端一致
    const index = feedingRecords.value.findIndex(
      (record) => record.id === id
    );
    if (index !== -1) {
      feedingRecords.value.splice(index, 1);
    }
  } catch (err) {
    console.error("删除记录错误:", err);
    error.value = err.message;

    // 如果 API 请求失败，在本地标记为已删除
    const index = feedingRecords.value.findIndex(
      (record) => record.id === id
    );
    if (index !== -1) {
      // 不实际删除，只在本地标记
      feedingRecords.value[index].deleted = 1;
      saveToLocalStorage();
    }
  } finally {
    isLoading.value = false;
  }
}

  function saveToLocalStorage() {
    localStorage.setItem(
      "feedingRecords",
      JSON.stringify(feedingRecords.value)
    );
  }

  // 初始加载数据
  loadRecords();

  return {
    feedingRecords,
    isLoading,
    error,
    sortedRecords,
    todayRecords,
    todayTotalAmount,
    weeklyStats,
    loadRecords,
    addRecord,
    updateRecord,
    deleteRecord,
  };
});
