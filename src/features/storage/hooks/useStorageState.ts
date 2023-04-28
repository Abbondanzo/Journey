import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';

export const useStorage = <T>(key: string, initialValue?: (T | () => T)) => {
  const [state,setState] = useState(() => {
    try {
      const value = await AsyncStorage.getItem(key)
      if (value !== null) {
        return JSON.parse(value)
      }
    } catch (e) {
      if (typeof initialValue === "function") {
        return initialValue()
      } else {
        return initialValue
      }
      
    }
  })
}
