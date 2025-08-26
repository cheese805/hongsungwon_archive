/* =========================
   Schedule Tab – Robust JS
   ========================= */

(() => {
  // 초기 월/년: 오늘 기준 (원하면 고정값 사용)
  let cursor = new Date(); // new Date(2025, 6, 1)

  // CSV 데이터
  let eventsData = [];
  let eventMap = new Map();

  // 색상 매핑
  const COLOR_MAP = {
    "뮤지컬 [개와 고양이의 시간]": "#7f83ce",
    "뮤지컬 [번 더 위치]": "#bc67b3",
    "뮤지컬 [클로버]": "#64d534",
    "뮤지컬 [무명, 준희]": "#c7b59e",
    "뮤지컬 [데카브리]": "#3b2e66",
  };
  const getColor = (title) => COLOR_MAP[title] || "#000";

  // ===== DOM refs =====
  const $prev = document.getElementById("prev-month");
  const $next = document.getElementById("next-month");
  const $monthYear = document.getElementById("month-year");
  const $tbody = document.getElementById("calendar-body");
  const $eventBox = document.getElementById("event-box");
  const $eventContent = document.getElementById("event-content");
  const $closeEvent = document.getElementById("close-event");
  const $calendarContainer = document.querySelector(".calendar-container");
  const $frame = document.querySelector(".schedule-page") || document.body;

  // (옵션) 메뉴 팝업
  const $menuBtn = document.getElementById("menu-btn");
  const $menuPopup = document.getElementById("menu-popup");

  // ===== 유틸 =====
  const pad2 = (n) => String(n).padStart(2, "0");
  const safeN = (v) => Number(String(v ?? "").trim());
  const ymdKey = (y, m, d) => `${y}-${pad2(m)}-${pad2(d)}`;

  function normalizeRow(r) {
    const year = safeN(r.year ?? r.Year);
    const month = safeN(r.month ?? r.Month);
    const day = safeN(r.day ?? r.Day);
    const time = String(r.time ?? r.Time ?? "").trim();
    const title = String(r.title ?? r.Title ?? "").trim();
    const cast = String(r.cast ?? r.Cast ?? "").trim();
    if (!year || !month || !day || !title) return null;
    return { year, month, day, time, title, cast };
  }

  function buildEventMap(rows) {
    const map = new Map();
    rows.forEach((e) => {
      const key = ymdKey(e.year, e.month, e.day);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    });
    for (const list of map.values()) {
      list.sort((a, b) => String(a.time).localeCompare(String(b.time)));
    }
    return map;
  }

  // ===== 달력 렌더 =====
  function renderCalendar(baseDate) {
    if (!$tbody || !$monthYear) return;

    $tbody.innerHTML = "";

    const year = baseDate.getFullYear();
    const month = baseDate.getMonth() + 1;

    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    let row = document.createElement("tr");
    for (let i = 0; i < firstDay; i++) row.appendChild(document.createElement("td"));

    for (let day = 1; day <= daysInMonth; day++) {
      const td = document.createElement("td");
      td.textContent = day;

      // 오늘 표시(원치 않으면 이 블록 제거)
      const today = new Date();
      if (year === today.getFullYear() && month === today.getMonth() + 1 && day === today.getDate()) {
        td.style.fontWeight = "600";
        td.style.textDecoration = "underline";
      }

      // 이벤트 점
      const key = ymdKey(year, month, day);
      const dayEvents = eventMap.get(key) || [];

      if (dayEvents.length > 0) {
        dayEvents.forEach((ev) => {
          const dot = document.createElement("div");
          dot.className = "dot";
          dot.style.backgroundColor = getColor(ev.title);
          td.appendChild(dot);
        });
        td.style.cursor = "pointer";
        // ✅ 문서로 전파되어 즉시 닫히는 문제 방지
        td.addEventListener("click", (e) => {
          e.stopPropagation();
          showEventList(dayEvents, td);
        });
      }

      row.appendChild(td);

      if ((firstDay + day) % 7 === 0) {
        $tbody.appendChild(row);
        row = document.createElement("tr");
      }
    }
    if (row.children.length > 0) $tbody.appendChild(row);

    $monthYear.textContent = `${year}년 ${month}월`;
  }

  // ===== 이벤트 팝업 =====
  function showEventList(events, anchorTd) {
    if (!$eventBox || !$eventContent) return;
    $eventContent.innerHTML = events.map(ev => `
      <div class="event-title">${ev.title}</div>
      <div><span class="event-label">DATE :</span>
          <span class="event-detail">${ev.year}.${pad2(ev.month)}.${pad2(ev.day)}</span></div>
      <div><span class="event-label">TIME :</span>
          <span class="event-detail">${ev.time}</span></div>
      <div><span class="event-label">CAST :</span>
          <span class="event-detail">${ev.cast}</span></div>
    `).join('<hr style="margin:10px 0;">');

    // 보이게 해서 크기 계산
    $eventBox.style.display = "block";
    // (겹침 방지)
    $eventBox.style.zIndex = "10000";

    const backdrop = document.getElementById('event-backdrop');
    if (backdrop) backdrop.classList.add('is-open');
    
    // 프레임 경계 보정
    const minLeft = frameRect.left + 8;
    const maxLeft = frameRect.right - boxRect.width - 8;
    if (left < minLeft) left = minLeft;
    if (left > maxLeft) left = maxLeft;

    const maxTop = frameRect.bottom - boxRect.height - 8;
    if (top > maxTop) {
      top = tdRect.top - boxRect.height - 8; // 위로 띄움
    }

  }

  function hideEventBox() {
    if ($eventBox) $eventBox.style.display = "none";
    const backdrop = document.getElementById('event-backdrop');
    if (backdrop) backdrop.classList.remove('is-open');
  }

  // ===== 네비게이션 =====
  function gotoPrevMonth() {
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
    renderCalendar(cursor);
    hideEventBox();
  }
  function gotoNextMonth() {
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    renderCalendar(cursor);
    hideEventBox();
  }

  // ===== 이벤트 바인딩 =====
  if ($prev) $prev.addEventListener("click", gotoPrevMonth);
  if ($next) $next.addEventListener("click", gotoNextMonth);

  // ✅ 팝업 내부 클릭/닫기 버튼 클릭 시 전파 차단 (즉시 닫힘 방지)
  if ($eventBox) $eventBox.addEventListener("click", (e) => e.stopPropagation());
  if ($closeEvent) $closeEvent.addEventListener("click", (e) => {
    e.stopPropagation();
    hideEventBox();
  });

  // 바깥 클릭/ESC로 팝업 닫기
  document.addEventListener("click", (e) => {
    if (!$eventBox || $eventBox.style.display !== "block") return;
    const within = $eventBox.contains(e.target);
    if (!within) hideEventBox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideEventBox();
  });

  // 메뉴 팝업(있을 때만)
  if ($menuBtn && $menuPopup) {
    $menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const visible = $menuPopup.style.display === "block";
      $menuPopup.style.display = visible ? "none" : "block";
    });
    document.addEventListener("click", () => ($menuPopup.style.display = "none"));
  }

  // ===== CSV 로드 =====
  function loadCSV() {
    if (typeof Papa === "undefined" || !Papa.parse) {
      console.warn("Papa.parse 가 로드되지 않았습니다. CSV 없이 달력만 렌더합니다.");
      renderCalendar(cursor);
      return;
    }
    Papa.parse("schedule.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const rows = (res.data || [])
          .map(normalizeRow)
          .filter(Boolean);
        eventsData = rows;
        eventMap = buildEventMap(eventsData);
        renderCalendar(cursor);
      },
      error: (err) => {
        console.error("CSV 파싱 오류:", err);
        renderCalendar(cursor);
      },
    });
  }

  // ===== 초기 렌더 =====
  document.addEventListener("DOMContentLoaded", () => {
    // 프레임이 위치 기준이 되도록 보장
    if ($frame && getComputedStyle($frame).position === "static") {
      $frame.style.position = "relative";
    }
    renderCalendar(cursor); // CSV 없이 먼저 그림
    loadCSV();              // CSV 로드 후 다시 렌더
  });
})();
