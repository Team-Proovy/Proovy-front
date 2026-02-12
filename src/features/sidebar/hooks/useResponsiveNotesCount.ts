import { useState, useEffect, type RefObject } from "react";

/**
 * 사이드바 가용 공간에 따라 최근 노트 리스트 노출 개수를 동적으로 계산하는 Hook
 *
 * 실제 렌더링된 리스트 아이템의 높이를 측정하여
 * 컨테이너에 정확히 n개의 완전한 아이템만 표시합니다.
 * 화면 크기 변화 시 자동으로 개수를 조정합니다.
 */
export const useResponsiveNotesCount = (
  containerRef: RefObject<HTMLDivElement | null>,
  listRef: RefObject<HTMLUListElement | null>,
  minCount: number = 1,
  maxCount: number = 50
) => {
  const [notesCount, setNotesCount] = useState<number>(20);

  useEffect(() => {
    const calculateNotesCount = () => {
      if (!containerRef.current || !listRef.current) {
        return;
      }

      const containerHeight = containerRef.current.clientHeight;
      const listElement = listRef.current;
      
      // 리스트의 직접 자식인 li 요소들 (skeleton 제외)
      const listItems = Array.from(listElement.children).filter(
        (child) => child.tagName === "LI"
      );

      if (listItems.length === 0) {
        // li 요소가 없을 때는 추정값으로 계산
        const ESTIMATED_ITEM_HEIGHT = 32; // py-[6px] + 텍스트 + gap
        const HEADER_HEIGHT = 20;
        const availableHeight = containerHeight - HEADER_HEIGHT;
        const estimatedCount = Math.floor(availableHeight / ESTIMATED_ITEM_HEIGHT);
        const count = Math.max(minCount, Math.min(estimatedCount, maxCount));
        setNotesCount(count);
        return;
      }

      // 첫 번째 아이템의 높이 측정 (margin, padding 포함)
      const firstItem = listItems[0] as HTMLElement;
      const itemStyles = window.getComputedStyle(firstItem);
      const itemHeight =
        firstItem.offsetHeight +
        parseFloat(itemStyles.marginTop) +
        parseFloat(itemStyles.marginBottom);

      // 리스트의 gap 계산 (Tailwind gap-0.5 = 0.125rem = 2px)
      const gapHeight = 2;

      // 리스트 영역의 실제 여유 높이 (제목 높이와 패딩 제외)
      const headerHeight = 20; // p 태그: text-[12px] + mb-2 + padding
      const availableHeight = containerHeight - headerHeight;

      // 정확히 n개가 들어갈 수 있는 높이 계산
      // 첫 아이템 높이 + (나머지 아이템 높이 + gap) * (n-1)
      let fittingCount = 0;

      // 첫 번째 아이템은 gap이 없음
      if (availableHeight >= itemHeight) {
        fittingCount = 1;
        let remainingHeight = availableHeight - itemHeight;

        // 추가 아이템들은 gap 포함
        const itemHeightWithGap = itemHeight + gapHeight;
        while (remainingHeight >= itemHeightWithGap && fittingCount < maxCount) {
          remainingHeight -= itemHeightWithGap;
          fittingCount++;
        }
      }

      // 최소 개수 제한
      fittingCount = Math.max(minCount, Math.min(fittingCount, maxCount));
      setNotesCount(fittingCount);
    };

    // 약간의 지연을 두고 초기 계산
    const timeoutId = setTimeout(() => {
      calculateNotesCount();
    }, 50);

    // ResizeObserver로 컨테이너 크기 변화 감지 (스크린 리사이즈, 사이드바 변화 등)
    const observer = new ResizeObserver(() => {
      calculateNotesCount();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // MutationObserver로 리스트 자식 요소 변화 감지
    const mutationObserver = new MutationObserver(() => {
      calculateNotesCount();
    });

    if (listRef.current) {
      mutationObserver.observe(listRef.current, {
        childList: true,
        subtree: false,
      });
    }

    // 창 리사이즈 이벤트도 감지
    const handleResize = () => {
      calculateNotesCount();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [containerRef, listRef, minCount, maxCount]);

  return notesCount;
};
