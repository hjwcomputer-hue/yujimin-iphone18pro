const qs = s => document.querySelector(s);
const qsa = s => [...document.querySelectorAll(s)];

const PASSCODE = "000411";

const screens = {
  lock: qs("#lockScreen"),
  face: qs("#faceScreen"),
  passcode: qs("#passcodeScreen"),
  home: qs("#homeScreen"),
  app: qs("#appScreen")
};

const overlays = {
  cc: qs("#controlCenter"),
  nc: qs("#notificationCenter"),
  spotlight: qs("#spotlight"),
  switcher: qs("#appSwitcher")
};

const appView = qs("#appView");
let currentScreen = "lock";
let currentChat = null;
let lastOpenedApps = [];
let passcodeInput = "";
let faceTimer = null;

const appMeta = {
  kakao:{title:"카카오톡", icon:"TALK", cls:"kakao"},
  messages:{title:"메시지", icon:"✉", cls:"messages"},
  phone:{title:"전화", icon:"☎", cls:"phone-icon"},
  photos:{title:"사진", icon:"✿", cls:"photos"},
  camera:{title:"카메라", icon:"◉", cls:"camera"},
  safari:{title:"Safari", icon:"⌁", cls:"safari"},
  notes:{title:"메모", icon:"▤", cls:"notes"},
  music:{title:"음악", icon:"♫", cls:"music"},
  calendar:{title:"캘린더", icon:"19", cls:"calendar"},
  clock:{title:"시계", icon:"◷", cls:"clock"},
  weather:{title:"날씨", icon:"☀", cls:"weather"},
  settings:{title:"설정", icon:"⚙", cls:"settings"}
};

function hideOverlays(){
  Object.values(overlays).forEach(x=>x.classList.remove("active"));
}

function showScreen(name){
  hideOverlays();
  Object.values(screens).forEach(s=>s.classList.remove("active"));
  screens[name].classList.add("active");
  currentScreen = name;
}

function openOverlay(name){
  Object.entries(overlays).forEach(([k,v])=>v.classList.toggle("active", k===name));
}

function nowTime(){
  return new Intl.DateTimeFormat("ko-KR",{hour:"numeric",minute:"2-digit",hour12:false}).format(new Date());
}

function updateClock(){
  const now = new Date();
  const time = nowTime();
  ["#statusTime","#lockTime","#homeClock","#ncTime"].forEach(sel=>{
    const el = qs(sel); if(el) el.textContent = time;
  });
  const date = new Intl.DateTimeFormat("ko-KR",{month:"long",day:"numeric",weekday:"long"}).format(now);
  qs("#lockDate").textContent = date;
  qs("#ncDate").textContent = date;
}
updateClock();
setInterval(updateClock,10000);

function toast(message){
  const el = qs("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(el._timer);
  el._timer = setTimeout(()=>el.classList.remove("show"),1600);
}

function flashIsland(text){
  const island = qs("#dynamicIsland");
  const label = qs("#islandText");
  island.classList.add("expanded");
  label.textContent = text;
  setTimeout(()=>{
    island.classList.remove("expanded");
    label.textContent = "YUJIMIN";
  },1800);
}
window.flashIsland = flashIsland;

/* Lock -> Face ID -> Passcode */
qs("#lockScreen").addEventListener("click",e=>{
  if(e.target.closest("#cameraQuick")){
    openApp("camera");
    return;
  }
  if(e.target.closest(".notification")) return;
  /* tap wakes screen; swipe up performs unlock */
});

function showFaceID(){
  showScreen("face");
  qs("#faceIcon").classList.remove("success");
  qs("#faceTitle").textContent = "Face ID";
  qs("#faceSub").textContent = "Face ID로 인증 중…";
  clearTimeout(faceTimer);
  faceTimer = setTimeout(()=>{
    qs("#faceTitle").textContent = "Face ID를 사용할 수 없음";
    qs("#faceSub").textContent = "암호를 입력하십시오";
    setTimeout(()=>showScreen("passcode"),650);
  },900);
}

function updatePasscodeDots(){
  qsa("#passcodeDots span").forEach((dot,i)=>dot.classList.toggle("filled",i<passcodeInput.length));
}

function resetPasscode(message=""){
  passcodeInput = "";
  updatePasscodeDots();
  qs("#passcodeMessage").textContent = message;
}

qsa("[data-key]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    if(passcodeInput.length>=6) return;
    passcodeInput += btn.dataset.key;
    updatePasscodeDots();

    if(passcodeInput.length===6){
      setTimeout(()=>{
        if(passcodeInput===PASSCODE){
          flashIsland("잠금 해제됨");
          resetPasscode();
          showScreen("home");
        }else{
          const dots = qs("#passcodeDots");
          dots.classList.add("passcode-shake");
          qs("#passcodeMessage").textContent = "암호가 올바르지 않습니다";
          setTimeout(()=>{
            dots.classList.remove("passcode-shake");
            resetPasscode("암호가 올바르지 않습니다");
          },420);
        }
      },120);
    }
  });
});

qs("#passcodeDelete").addEventListener("click",()=>{
  passcodeInput = passcodeInput.slice(0,-1);
  updatePasscodeDots();
  qs("#passcodeMessage").textContent = "";
});
qs("#passcodeCancel").addEventListener("click",()=>{ resetPasscode(); showScreen("lock"); });
qs("#passcodeEmergency").addEventListener("click",()=>toast("긴급 통화를 사용할 수 없습니다"));

qs("#flashlightBtn").addEventListener("click",e=>{
  e.stopPropagation();
  e.currentTarget.classList.toggle("active");
  toast(e.currentTarget.classList.contains("active") ? "손전등 켬" : "손전등 끔");
});

qs("#homeIndicator").addEventListener("click",()=>showScreen("home"));

/* App opening */
qsa("[data-app]").forEach(btn=>btn.addEventListener("click",()=>openApp(btn.dataset.app)));

function rememberApp(name){
  lastOpenedApps = [name, ...lastOpenedApps.filter(x=>x!==name)].slice(0,5);
}

function header(title,back="홈"){
  return `<div class="app-header">
    <button onclick="goBack()">&lsaquo; ${back}</button>
    <strong>${title}</strong>
    <span></span>
  </div>`;
}

window.goBack = function(){
  if(currentChat){
    currentChat = null;
    openApp("kakao");
  }else showScreen("home");
};

const apps = {
  kakao(){
    return header("카카오톡")+`<div class="app-body list">
      <button class="row" onclick="openChat('winter')"><div class="avatar">M</div><div class="row-main"><div class="row-title">민정</div><div class="row-sub">끝났어?</div></div><span class="badge">2</span></button>
      <button class="row" onclick="openChat('manager')"><div class="avatar">MGR</div><div class="row-main"><div class="row-title">매니저</div><div class="row-sub">내일 일정 확인 부탁드립니다.</div></div></button>
      <button class="row" onclick="openChat('group')"><div class="avatar">A</div><div class="row-main"><div class="row-title">aespa 단톡</div><div class="row-sub">사진 보냈어 ㅋㅋ</div></div><span class="badge">7</span></button>
      <button class="row"><div class="avatar">S</div><div class="row-main"><div class="row-title">스타일리스트</div><div class="row-sub">피팅 사진 전달드려요!</div></div></button>
    </div>`;
  },
  messages(){
    return header("메시지")+`<div class="app-body list">
      <div class="row"><div class="avatar">♡</div><div class="row-main"><div class="row-title">엄마</div><div class="row-sub">밥 꼭 챙겨 먹어</div></div></div>
      <div class="row"><div class="avatar">S</div><div class="row-main"><div class="row-title">스타일리스트</div><div class="row-sub">피팅 사진 보내드릴게요!</div></div></div>
      <div class="row"><div class="avatar">N</div><div class="row-main"><div class="row-title">닝닝</div><div class="row-sub">언니 어디야</div></div></div>
    </div>`;
  },
  phone(){
    return header("전화")+`<div class="app-body">
      <div class="dial">
        <div class="dial-number" id="dialNumber"></div>
        <div class="keypad">
          ${["1","2","3","4","5","6","7","8","9","*","0","#"].map(n=>`<button class="key" onclick="dial('${n}')">${n}</button>`).join("")}
          <span></span><button class="key callbtn" onclick="fakeCall()">☎</button><button class="key" onclick="backspaceDial()">⌫</button>
        </div>
      </div>
      <div class="phone-tabs"><span>즐겨찾기</span><span>최근 통화</span><span>연락처</span><b>키패드</b><span>음성 사서함</span></div>
    </div>`;
  },
  photos(){
    return header("사진")+`<div class="app-body"><div class="photo-grid">${
      Array.from({length:36},(_,i)=>`<button class="photo" onclick="openPhoto(${i+1})">FAN PHOTO ${i+1}</button>`).join("")
    }</div></div>`;
  },
  camera(){
    return header("카메라")+`<div class="app-body camera-view">
      <div class="camera-preview">카메라 미리보기</div>
      <div class="camera-controls"><div class="thumb"></div><button class="shutter" onclick="takePhoto()"></button><span>↻</span></div>
    </div>`;
  },
  safari(){
    return header("Safari")+`<div class="app-body">
      <div class="safari-top"><div class="address">fanmade.local</div></div>
      <div class="browser-page"><h1>YUJIMIN</h1><p>YUJIMIN iPhone Home</p>
        <div class="browser-card"><b>즐겨찾기</b><p>팬페이지 · 음악 · 사진 · 일정</p></div>
        <div class="browser-card"><b>개인정보 안내</b><p>개인정보 보호 설정이 적용되어 있습니다.</p></div>
      </div>
    </div>`;
  },
  notes(){
    return header("메모")+`<div class="app-body">
      <div class="note"><b>오늘 할 일</b><br><br>• 연습<br>• 스케줄 확인<br>• 사진 정리<br>• 물 많이 마시기<br><br>✿</div>
      <div class="note"><b>사고 싶은 것</b><br><br>• 향초<br>• 새 케이스<br>• 작은 카메라</div>
    </div>`;
  },
  music(){
    return header("음악")+`<div class="app-body music-page">
      <div class="album">YJ</div><small>재생 중</small><h2>My Playlist</h2><p>My Track</p>
      <div class="progress"><span id="musicProgress"></span></div>
      <button onclick="toggleMusic()" style="border:0;background:none;font-size:32px" id="musicToggle">▶</button>
    </div>`;
  },
  calendar(){
    return header("캘린더")+`<div class="app-body calendar-page">
      <div class="calendar-title">2026년 10월</div>
      <div class="days">${["일","월","화","수","목","금","토"].map(x=>`<b class="day">${x}</b>`).join("")}
      ${Array.from({length:31},(_,i)=>`<div class="day ${i+1===19?'today':''}">${i+1}</div>`).join("")}</div>
      <div class="note"><b>오늘</b><br>연습 · 촬영 준비 · 휴식</div>
    </div>`;
  },
  clock(){
    return header("시계")+`<div class="app-body clock-page"><div><div id="liveClock" class="big-clock">${nowTime()}</div><p>서울</p></div></div>`;
  },
  weather(){
    return header("날씨")+`<div class="app-body weather-page"><div>서울</div><div class="weather-temp">19°</div><h2>맑음</h2><p>최고 22° · 최저 13°</p><div class="browser-card" style="color:#111;text-align:left"><b>오늘의 날씨</b><p>서울 기준 화면</p></div></div>`;
  },
  settings(){
    return header("설정")+`<div class="app-body">
      <div class="settings-group"><div class="setting"><b>YUJIMIN</b><div class="row-sub">Fan-made Apple Account</div></div></div>
      <div class="settings-group">
        <div class="setting">에어플레인 모드 <span class="toggle"></span></div>
        <div class="setting">Wi‑Fi <span style="float:right;color:#777">Studio WiFi ›</span></div>
        <div class="setting">Bluetooth <span style="float:right;color:#777">켬 ›</span></div>
      </div>
      <div class="settings-group">
        <div class="setting">알림 <span style="float:right">›</span></div>
        <div class="setting">사운드 및 햅틱 <span style="float:right">›</span></div>
        <div class="setting">집중 모드 <span style="float:right">›</span></div>
        <div class="setting">배경화면 <span style="float:right">›</span></div>
        <div class="setting">디스플레이 및 밝기 <span style="float:right">›</span></div>
      </div>
    </div>`;
  }
};

function openApp(name){
  currentChat = null;
  rememberApp(name);
  appView.innerHTML = apps[name] ? apps[name]() : header("앱")+"<div class='app-body'></div>";
  showScreen("app");
  if(name==="clock"){
    const timer = setInterval(()=>{
      const el = qs("#liveClock");
      if(!el){ clearInterval(timer); return; }
      el.textContent = nowTime();
    },1000);
  }
}

window.openChat = function(type){
  currentChat = type;
  const chatMap = {
    winter:{title:"민정",bubbles:[["them","끝났어?"],["me","응 방금!"],["them","그럼 내려와"],["me","왜"],["them","그냥. 빨리"],["me","ㅋㅋ 알겠어"]]},
    manager:{title:"매니저",bubbles:[["them","내일 첫 일정은 오전 리허설입니다."],["me","확인했습니다!"],["them","차량 시간도 다시 보내드릴게요."]]},
    group:{title:"aespa 단톡",bubbles:[["them","사진 보냈어 ㅋㅋ"],["me","아 이건 아니지"],["them","ㅋㅋㅋㅋㅋㅋ"],["me","삭제해줘 제발"]]}
  };
  const c = chatMap[type];
  appView.innerHTML = header(c.title,"카카오톡")+`<div class="app-body" style="position:relative">
    <div class="chat"><div class="chat-time">오늘</div>${c.bubbles.map(([side,msg])=>`<div class="bubble ${side}">${msg}</div>`).join("")}</div>
    <div class="chat-input"><input id="chatText" placeholder="메시지"><button onclick="sendChat()">전송</button></div>
  </div>`;
  showScreen("app");
};

window.sendChat = function(){
  const input = qs("#chatText");
  if(!input || !input.value.trim()) return;
  const chat = qs(".chat");
  const div = document.createElement("div");
  div.className = "bubble me";
  div.textContent = input.value.trim();
  chat.appendChild(div);
  input.value = "";
  chat.scrollTop = chat.scrollHeight;
};

window.dial = n => {
  const el = qs("#dialNumber");
  if(el) el.textContent = (el.textContent+n).slice(0,16);
};
window.backspaceDial = ()=> {
  const el = qs("#dialNumber");
  if(el) el.textContent = el.textContent.slice(0,-1);
};
window.fakeCall = ()=>{
  const el = qs("#dialNumber");
  if(!el || !el.textContent){ toast("번호를 입력하세요"); return; }
  flashIsland("통화 연결 중…");
};
window.openPhoto = n=>{
  appView.innerHTML = header(`사진 ${n}`,"사진")+`<div class="app-body photo-viewer">
    <div class="photo-view">FAN PHOTO ${n}</div>
    <div class="photo-toolbar"><span>♡</span><span>↥</span><span>⌫</span></div>
  </div>`;
};
window.takePhoto = ()=>{
  flashIsland("사진 저장됨");
  toast("사진에 저장됨");
};

let musicPlaying = false;
window.toggleMusic = ()=>{
  musicPlaying = !musicPlaying;
  const b = qs("#musicToggle");
  if(b) b.textContent = musicPlaying ? "❚❚" : "▶";
  flashIsland(musicPlaying ? "♫ 재생 중" : "일시 정지");
};

/* Dynamic Island */
qs("#dynamicIsland").addEventListener("click",()=>flashIsland("♫ My Playlist"));

/* Control Center */
qsa("[data-toggle]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    btn.classList.toggle("active");
    const key = btn.dataset.toggle;
    const state = btn.classList.contains("active") ? "켬" : "끔";
    toast(`${key} ${state}`);
  });
});
qs("#brightness").addEventListener("input",e=>{
  qs("#phone").style.filter = `brightness(${e.target.value/100})`;
});
qs("#volume").addEventListener("input",e=>toast(`볼륨 ${e.target.value}%`));
qs("#ccMusic").addEventListener("click",()=>{ hideOverlays(); openApp("music"); });
qs("#ccCamera").addEventListener("click",()=>{ hideOverlays(); openApp("camera"); });
qs("#ccCalc").addEventListener("click",()=>toast("계산기 데모"));

/* Notifications */
qsa("[data-open-app]").forEach(btn=>{
  btn.addEventListener("click",e=>{
    e.stopPropagation();
    hideOverlays();
    openApp(btn.dataset.openApp);
  });
});

/* Spotlight */
qs("#homeSearchBtn").addEventListener("click",()=>openSpotlight());
qs(".spotlight-pill").addEventListener("click",()=>openSpotlight());
qs("#spotlightClose").addEventListener("click",hideOverlays);

function openSpotlight(){
  openOverlay("spotlight");
  qs("#spotlightInput").value = "";
  renderSearch("");
  setTimeout(()=>qs("#spotlightInput").focus(),50);
}
qs("#spotlightInput").addEventListener("input",e=>renderSearch(e.target.value));

function renderSearch(query){
  const q = query.trim().toLowerCase();
  const items = Object.entries(appMeta).filter(([key,m])=>!q || m.title.toLowerCase().includes(q) || key.includes(q));
  qs("#spotlightResults").innerHTML = items.map(([key,m])=>`
    <button class="search-result" onclick="hideOverlays();openApp('${key}')">
      <span class="app-icon ${m.cls}">${m.icon}</span><b>${m.title}</b>
    </button>`).join("");
}
window.hideOverlays = hideOverlays;

/* App switcher */
let homePressTimer = null;
qs("#homeIndicator").addEventListener("pointerdown",()=>{
  homePressTimer = setTimeout(()=>showSwitcher(),420);
});
["pointerup","pointerleave","pointercancel"].forEach(ev=>{
  qs("#homeIndicator").addEventListener(ev,()=>clearTimeout(homePressTimer));
});

function showSwitcher(){
  const cards = lastOpenedApps.length ? lastOpenedApps : ["kakao","messages","music"];
  qs("#switcherCards").innerHTML = cards.map(name=>`
    <button class="switch-card" onclick="hideOverlays();openApp('${name}')">
      <div class="switch-title">${appMeta[name].title}</div>
      <div class="switch-preview">최근 사용한 ${appMeta[name].title}</div>
    </button>`).join("");
  openOverlay("switcher");
}

/* Gestures */
let startY=0,startX=0;
qs("#phone").addEventListener("pointerdown",e=>{
  startY=e.clientY; startX=e.clientX;
});
qs("#phone").addEventListener("pointerup",e=>{
  const dy=e.clientY-startY;
  const rect=qs("#phone").getBoundingClientRect();
  if(startY-rect.top<95 && dy>70){
    if(startX>rect.left+rect.width/2) openOverlay("cc");
    else openOverlay("nc");
  }
  if(Object.values(overlays).some(x=>x.classList.contains("active")) && dy<-70){
    hideOverlays();
  }
});

/* Battery demo */
function updateBattery(){
  if(navigator.getBattery){
    navigator.getBattery().then(b=>{
      const pct = Math.round(b.level*100);
      qs("#miniBattery").textContent = pct;
      qs("#batteryPercent").textContent = pct+"%";
      qs("#ccBattery").textContent = pct+"%";
      const ring = qs(".battery-ring");
      ring.style.background = `conic-gradient(#61db78 0 ${pct}%,#ffffff30 ${pct}% 100%)`;
    }).catch(()=>{});
  }
}
updateBattery();

/* Service worker */
if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}


/* ===== iOS-like interaction refinement ===== */
let gestureStart = null;

function animateHomeReturn(){
  const view = document.querySelector("#appView");
  if(currentScreen === "app" && view){
    view.style.transition = "transform .28s cubic-bezier(.19,.72,.18,1), opacity .28s ease";
    view.style.transform = "scale(.82)";
    view.style.opacity = ".15";
    setTimeout(()=>{
      view.style.transition = "";
      view.style.transform = "";
      view.style.opacity = "";
      showScreen("home");
    },220);
  } else {
    showScreen("home");
  }
}

document.querySelector("#homeIndicator").addEventListener("dblclick", showSwitcher);

document.querySelector("#phone").addEventListener("touchstart", e=>{
  const t = e.touches[0];
  gestureStart = {x:t.clientX,y:t.clientY,time:Date.now()};
},{passive:true});

document.querySelector("#phone").addEventListener("touchend", e=>{
  if(!gestureStart) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - gestureStart.x;
  const dy = t.clientY - gestureStart.y;
  const dt = Date.now() - gestureStart.time;

  const rect = document.querySelector("#phone").getBoundingClientRect();
  const bottomZone = gestureStart.y > rect.bottom - 80;

  if(bottomZone && dy < -55 && Math.abs(dx) < 80 && dt < 700){
    animateHomeReturn();
  }

  gestureStart = null;
},{passive:true});

/* app icon long-press wobble */
let iconHold;
document.querySelectorAll(".app").forEach(app=>{
  app.addEventListener("pointerdown",()=>{
    iconHold = setTimeout(()=>{
      document.querySelectorAll(".app-icon").forEach(icon=>{
        icon.animate(
          [
            {transform:"rotate(-1.2deg)"},
            {transform:"rotate(1.2deg)"},
            {transform:"rotate(-1.2deg)"}
          ],
          {duration:260,iterations:4}
        );
      });
      toast("홈 화면 편집");
    },650);
  });
  ["pointerup","pointerleave","pointercancel"].forEach(ev=>{
    app.addEventListener(ev,()=>clearTimeout(iconHold));
  });
});


/* iOS 27 gesture tuning */
let iosGesture = null;
const phoneEl = document.querySelector("#phone");

phoneEl.addEventListener("pointerdown",e=>{
  const rect = phoneEl.getBoundingClientRect();
  iosGesture = {
    x:e.clientX, y:e.clientY,
    relX:(e.clientX-rect.left)/rect.width,
    relY:(e.clientY-rect.top)/rect.height,
    time:performance.now()
  };
});

phoneEl.addEventListener("pointerup",e=>{
  if(!iosGesture) return;
  const dy = e.clientY-iosGesture.y;
  const dx = e.clientX-iosGesture.x;
  const elapsed = performance.now()-iosGesture.time;

  /* right corner: Control Center */
  if(iosGesture.relY < .085 && iosGesture.relX > .67 && dy > 58 && elapsed < 900){
    openOverlay("cc");
  }
  /* upper-left/center: Notification Center */
  else if(iosGesture.relY < .085 && iosGesture.relX <= .67 && dy > 58 && elapsed < 900){
    openOverlay("nc");
  }

  /* lock-screen upward swipe starts authentication */
  if(currentScreen === "lock" && iosGesture.relY > .55 && dy < -55){
    showFaceID();
  }

  /* app: upward home gesture */
  if(currentScreen === "app" && iosGesture.relY > .88 && dy < -45 && Math.abs(dx) < 90){
    animateHomeReturn();
  }

  iosGesture = null;
});

/* lock screen left swipe opens Camera */
let lockTouchStart = null;
document.querySelector("#lockScreen").addEventListener("pointerdown",e=>{
  lockTouchStart = {x:e.clientX,y:e.clientY};
});
document.querySelector("#lockScreen").addEventListener("pointerup",e=>{
  if(!lockTouchStart) return;
  const dx = e.clientX-lockTouchStart.x;
  const dy = e.clientY-lockTouchStart.y;
  if(dx < -70 && Math.abs(dy)<80){
    openApp("camera");
  }
  lockTouchStart = null;
});
