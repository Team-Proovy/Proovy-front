import { useState, useEffect, useCallback } from "react";
import { getAssetDetail } from "../api/assetApi";
import type { AssetDetailResponseData } from "../types/asset";

export const useAssetPolling = (assetId: number | null, interval = 3000) => {
  const [asset, setAsset] = useState<AssetDetailResponseData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!assetId) return;

    try {
      const response = await getAssetDetail(assetId);
      const data = response.result;
      setAsset(data);

      // OCR 상태가 'completed'거나 'failed'면 폴링 중단
      if (data.ocrStatus === "completed" || data.ocrStatus === "failed") {
        setIsLoading(false);
        return;
      }

      // 아직 처리 중이면 설정된 간격(interval) 후에 다시 호출
      setTimeout(fetchStatus, interval);
    } catch (err) {
      setError("자산 정보를 불러오는 중 오류가 발생했다.");
      setIsLoading(false);
    }
  }, [assetId, interval]);

  useEffect(() => {
    if (assetId) {
      setIsLoading(true);
      setError(null);
      fetchStatus();
    }
  }, [assetId, fetchStatus]);

  return {
    asset,
    isProcessing:
      asset?.ocrStatus === "processing" || asset?.ocrStatus === "pending",
    isLoading,
    error,
  };
};
