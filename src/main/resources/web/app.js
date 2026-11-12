const $ = id => document.getElementById(id);
let tasks = [], activeView = "overview", calendarDate = new Date(), toastTimer;

async function api(method, data) {
  const options = { method, headers: { "Content-Type": "application/x-www-form-urlencoded" } };
  if (data) options.body = new URLSearchParams(data).toString();
  const res = await fetch("/api/tasks", options);
  const result = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(result.error || "Something went wrong.");
  return result;
}
const todayISO = () => new Date().toISOString().slice(0,10);
const prettyDate = d => d ? new Date(d+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short"}) : "No deadline";
const statusName = s => ({TODO:"To do",IN_PROGRESS:"In progress",DONE:"Completed"}[s] || s);
const escapeHTML = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const isOverdue = t => t.dueDate && t.dueDate < todayISO() && t.status !== "DONE";
const priorityRank = {URGENT:4,HIGH:3,MEDIUM:2,LOW:1};

async function loadTasks() {
  try { tasks = await api("GET"); renderAll(); }
  catch(e) { toast(e.message + " — check that the Java server is running."); }
}
function renderAll() {
  const total=tasks.length, done=tasks.filter(t=>t.status==="DONE").length;
  const progress=tasks.filter(t=>t.status==="IN_PROGRESS").length, overdue=tasks.filter(isOverdue).length;
  const pct=total?Math.round(done/total*100):0;
  $("total").textContent=total; $("done").textContent=done; $("progress").textContent=progress; $("overdue").textContent=overdue;
  $("navTaskCount").textContent=total; $("heroPercent").textContent=pct+"%"; $("heroProgress").style.width=pct+"%";
  $("ringPercent").textContent=pct+"%"; $("weeklyRing").style.background=`conic-gradient(var(--purple) ${pct*3.6}deg,#eeecf5 0deg)`;
  $("legendDone").textContent=done; $("legendTodo").textContent=total-done;
  renderTaskList(tasks.slice().sort((a,b)=>(a.dueDate||"9999").localeCompare(b.dueDate||"9999")).slice(0,6),"taskList");
  renderTaskList(filteredTasks(), "allTaskList");
  renderUpcoming(); renderBoard(); renderCalendar(); renderAnalytics();
}
function filteredTasks() {
  const query=($("allSearch")?.value || $("searchInput")?.value || "").toLowerCase();
  const status=$("statusFilter")?.value || "ALL", category=$("categoryFilter")?.value || "ALL", priority=$("priorityFilter")?.value || "ALL", sort=$("sortSelect")?.value || "due";
  let arr=tasks.filter(t=>(t.title+" "+t.description).toLowerCase().includes(query) &&
    (status==="ALL"||t.status===status) && (category==="ALL"||t.category===category) && (priority==="ALL"||t.priority===priority));
  if(sort==="priority") arr.sort((a,b)=>priorityRank[b.priority]-priorityRank[a.priority]);
  else if(sort==="newest") arr.sort((a,b)=>b.id-a.id);
  else if(sort==="az") arr.sort((a,b)=>a.title.localeCompare(b.title));
  else arr.sort((a,b)=>(a.dueDate||"9999").localeCompare(b.dueDate||"9999"));
  return arr;
}
function renderTaskList(arr,target) {
  const el=$(target); if(!el)return;
  if(!arr.length){el.innerHTML='<div class="empty">Nothing here yet. Create a task and get moving ✦</div>';return;}
  el.innerHTML=arr.map(t=>`<article class="task-row ${t.status==="DONE"?"is-done":""}">
    <input class="task-check" type="checkbox" ${t.status==="DONE"?"checked":""} aria-label="Complete ${escapeHTML(t.title)}" onchange="quickStatus(${t.id},this.checked)">
    <div class="task-info"><div class="task-name">${escapeHTML(t.title)}</div><div class="task-desc">${escapeHTML(t.description||"No description added")}</div><div class="task-meta"><span class="tag">${escapeHTML(t.category)}</span><span class="priority priority-${t.priority}">${t.priority.toLowerCase()}</span><span class="due ${isOverdue(t)?"late":""}">${isOverdue(t)?"Overdue · ": ""}${escapeHTML(prettyDate(t.dueDate))}</span></div></div>
    <div class="row-actions"><button class="mini-btn" onclick="editTask(${t.id})">Edit</button><button class="mini-btn" onclick="deleteTask(${t.id})">×</button></div></article>`).join("");
}
async function quickStatus(id, checked) { const t=tasks.find(x=>x.id===id); if(!t)return; await updateTask({...t,status:checked?"DONE":"TODO"}); }
function openModal(task=null) {
  $("taskForm").reset(); $("taskId").value=task?.id||""; $("title").value=task?.title||""; $("description").value=task?.description||"";
  $("category").value=task?.category||"Personal"; $("priority").value=task?.priority||"MEDIUM"; $("dueDate").value=task?.dueDate||"";
  $("status").value=task?.status||"TODO"; $("modalTitle").textContent=task?"Edit task":"Create a task";
  $("saveBtn").innerHTML=task?"Save changes <span>→</span>":"Create task <span>→</span>"; $("formMessage").textContent="";
  $("modalBackdrop").hidden=false; setTimeout(()=>$("title").focus(),50);
}
function closeModal(){ $("modalBackdrop").hidden=true; }
function editTask(id){const t=tasks.find(x=>x.id===id);if(t)openModal(t);}
async function updateTask(t) {
  try { await api("PUT",{id:t.id,title:t.title,description:t.description,category:t.category,priority:t.priority,dueDate:t.dueDate,status:t.status}); await loadTasks(); toast("Task updated."); }
  catch(e){toast(e.message);}
}
async function deleteTask(id) {
  const t=tasks.find(x=>x.id===id); if(!t||!confirm(`Delete "${t.title}"? This cannot be undone.`))return;
  try{await api("DELETE",{id});await loadTasks();toast("Task deleted.");}catch(e){toast(e.message);}
}
$("taskForm").addEventListener("submit",async e=>{
  e.preventDefault(); const id=$("taskId").value;
  const data={title:$("title").value,description:$("description").value,category:$("category").value,priority:$("priority").value,dueDate:$("dueDate").value,status:$("status").value};
  try{if(id)await api("PUT",{id,...data});else await api("POST",data);closeModal();await loadTasks();toast(id?"Changes saved.":"Task created. Let's go!");}
  catch(err){$("formMessage").textContent=err.message;}
});
function renderUpcoming(){
  const upcoming=tasks.filter(t=>t.dueDate&&t.status!=="DONE").sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).slice(0,4);
  $("upcomingList").innerHTML=upcoming.length?upcoming.map(t=>{const d=new Date(t.dueDate+"T00:00:00");return `<div class="upcoming-item"><div class="date-box">${d.toLocaleDateString("en",{month:"short"}).toUpperCase()}<br>${d.getDate()}</div><div><strong>${escapeHTML(t.title)}</strong><small>${isOverdue(t)?"Overdue":statusName(t.status)} · ${escapeHTML(t.category)}</small></div></div>`}).join(""):'<div class="empty">No upcoming deadlines.</div>';
}
function renderBoard(){
  const groups=[["TODO","todoColumn","todoCount"],["IN_PROGRESS","progressColumn","progressCount"],["DONE","doneColumn","doneCount"]];
  groups.forEach(([status,el,count])=>{const arr=tasks.filter(t=>t.status===status);$(count).textContent=arr.length;
    $(el).innerHTML=arr.map(t=>`<article class="board-card" draggable="true" data-id="${t.id}" ondragstart="dragStart(event)"><strong>${escapeHTML(t.title)}</strong><p>${escapeHTML(t.description||"No description")}</p><div class="task-meta"><span class="priority priority-${t.priority}">${t.priority.toLowerCase()}</span><span class="tag">${escapeHTML(t.category)}</span></div><select aria-label="Move task" onchange="moveTask(${t.id},this.value)"><option value="TODO" ${status==="TODO"?"selected":""}>To do</option><option value="IN_PROGRESS" ${status==="IN_PROGRESS"?"selected":""}>In progress</option><option value="DONE" ${status==="DONE"?"selected":""}>Completed</option></select></article>`).join("")||'<div class="empty">Drop tasks here</div>';
  });
}
function dragStart(e){e.dataTransfer.setData("text/plain",e.currentTarget.dataset.id);}
async function moveTask(id,status){const t=tasks.find(x=>x.id===id);if(t)await updateTask({...t,status});}
["todoColumn","progressColumn","doneColumn"].forEach(id=>{const el=$(id);el.addEventListener("dragover",e=>e.preventDefault());el.addEventListener("drop",e=>{e.preventDefault();const taskId=Number(e.dataTransfer.getData("text/plain"));const status=el.dataset.status;moveTask(taskId,status);});});
function renderCalendar(){
  const y=calendarDate.getFullYear(),m=calendarDate.getMonth(),first=new Date(y,m,1),start=(first.getDay()+6)%7,days=new Date(y,m+1,0).getDate();
  $("monthLabel").textContent=calendarDate.toLocaleDateString("en",{month:"long",year:"numeric"});
  const names=["MON","TUE","WED","THU","FRI","SAT","SUN"];let html=names.map(n=>`<div class="calendar-cell day-name">${n}</div>`).join("");
  for(let i=0;i<42;i++){const day=i-start+1;const date=new Date(y,m,day);const iso=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
    const inMonth=day>=1&&day<=days;const dayTasks=inMonth?tasks.filter(t=>t.dueDate===iso):[];
    html+=`<div class="calendar-cell ${inMonth?"":"muted-day"} ${iso===todayISO()?"today":""}"><div class="day-number">${date.getDate()}</div>${dayTasks.slice(0,3).map(t=>`<div class="calendar-task ${t.status}" title="${escapeHTML(t.title)}">${escapeHTML(t.title)}</div>`).join("")}${dayTasks.length>3?`<small>+${dayTasks.length-3} more</small>`:""}</div>`;
  }$("calendarGrid").innerHTML=html;
}
function renderAnalytics(){
  const total=tasks.length,done=tasks.filter(t=>t.status==="DONE").length,pct=total?Math.round(done/total*100):0;
  $("analyticsPercent").textContent=pct+"%";$("analyticsBar").style.width=pct+"%";
  $("analyticsBreakdown").innerHTML=[["To do",tasks.filter(t=>t.status==="TODO").length],["In progress",tasks.filter(t=>t.status==="IN_PROGRESS").length],["Completed",done]].map(x=>`<div><strong>${x[1]}</strong><small>${x[0]}</small></div>`).join("");
  const cats=["Personal","Academic","Work","Projects","Other"],max=Math.max(1,...cats.map(c=>tasks.filter(t=>t.category===c).length));
  $("categoryBreakdown").innerHTML=cats.map(c=>{const n=tasks.filter(t=>t.category===c).length;return `<div class="category-row"><div class="category-label"><span>${c}</span><strong>${n}</strong></div><div class="category-track"><span style="width:${n/max*100}%"></span></div></div>`}).join("");
}
function setView(view){
  activeView=view;document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  $("overviewPanels").hidden=view!=="overview";["tasks","board","calendar","analytics"].forEach(v=>$(v+"View").hidden=view!==v);
  const titles={overview:["Good things start with a plan.","Here's what's happening in your workspace today."],tasks:["Everything on your plate.","Find, filter and organize every task."],board:["Move work forward.","A clear view of what's next, what's moving and what's done."],calendar:["Make time for what matters.","Your deadlines, laid out across the month."],analytics:["Look how far you've come.","A snapshot of your consistency and progress."]};
  $("pageTitle").textContent=titles[view][0];$("pageSubtitle").textContent=titles[view][1];
  $("dateLabel").textContent=new Date().toLocaleDateString("en",{weekday:"long",month:"long",day:"numeric"}).toUpperCase();
  renderAll();
}
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
document.querySelectorAll("[data-jump]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.jump)));
["heroAdd","addTaskBtn"].forEach(id=>$(id).addEventListener("click",()=>openModal()));
["closeModal","cancelModal"].forEach(id=>$(id).addEventListener("click",closeModal));
$("modalBackdrop").addEventListener("click",e=>{if(e.target===$("modalBackdrop"))closeModal();});
$("searchInput").addEventListener("input",()=>renderTaskList(filteredTasks().slice(0,6),"taskList"));
["allSearch","statusFilter","categoryFilter","priorityFilter","sortSelect"].forEach(id=>$(id).addEventListener("input",()=>{renderTaskList(filteredTasks(),"allTaskList");if(id==="statusFilter"||id==="sortSelect")renderTaskList(filteredTasks().slice(0,6),"taskList");}));
$("prevMonth").onclick=()=>{calendarDate.setMonth(calendarDate.getMonth()-1);renderCalendar();};
$("nextMonth").onclick=()=>{calendarDate.setMonth(calendarDate.getMonth()+1);renderCalendar();};
$("themeBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("taskflow-theme",document.body.classList.contains("dark")?"dark":"light");};
if(localStorage.getItem("taskflow-theme")==="dark")document.body.classList.add("dark");
function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2600);}
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();setView("tasks");$("allSearch").focus();}});
loadTasks();