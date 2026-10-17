const KEY="voltpro-academy-v1";
const state=JSON.parse(localStorage.getItem(KEY)||"null")||{view:"dashboard",completed:[],checks:[true,true,false,false,false],quiz:{},safety:false,language:"DE",labDone:[],student:"Student"};
function save(){localStorage.setItem(KEY,JSON.stringify(state));updateProgress()}
function toast(m){var e=document.getElementById("toast");e.textContent=m;e.classList.add("show");clearTimeout(window._t);window._t=setTimeout(function(){e.classList.remove("show")},2200)}
function nav(v){state.view=v;save();render()}
var modules=[
{id:"basics",icon:"⚡",title:"Elektrische Grundlagen",level:"Level 1",time:"35 min",desc:"Spannung, Strom, Widerstand, Leistung und Ohmsches Gesetz von Grund auf.",lessons:["Was ist elektrische Spannung?","Strom und Stromkreis","Widerstand und Ohmsches Gesetz","Leistung und Energie"],body:"Elektrische Spannung U ist der Potentialunterschied, der Ladungen antreibt. Strom I beschreibt den Ladungsfluss. Widerstand R begrenzt diesen Fluss. Die Grundbeziehung lautet U = R × I. Für praktische Berechnungen gilt außerdem P = U × I."},
{id:"germany",icon:"🇩🇪",title:"Elektroinstallation in Deutschland",level:"Level 2",time:"45 min",desc:"L1, N, PE, Schutzleiter, Farben, Schuko, Stromkreise und Installationsbegriffe.",lessons:["L1 / N / PE verstehen","Leiterfarben","Schuko-Steckdose","Stromkreis und Verteilung"],body:"In der deutschen Niederspannungsinstallation sind Außenleiter, Neutralleiter und Schutzleiter zentrale Begriffe. Leiterfarben und Installationsregeln müssen anhand der aktuellen und konkreten Normen bewertet werden. Die Academy vermittelt Prinzipien und ersetzt keine Fachplanung."},
{id:"safety",icon:"🛡️",title:"Sicheres Arbeiten",level:"Safety",time:"30 min",desc:"Die fünf Sicherheitsregeln, Prüfmittel, PSA und sichere Arbeitsvorbereitung.",lessons:["Die fünf Sicherheitsregeln","Spannungsfreiheit feststellen","Messgerät sicher verwenden","PSA und Gefährdungsbeurteilung"],body:"Sicherheit kommt vor Geschwindigkeit. Vor Arbeiten an elektrischen Anlagen muss die konkrete Situation fachgerecht beurteilt werden. Die Academy simuliert sichere Abläufe und ist keine Freigabe für Arbeiten an realen Anlagen."},
{id:"circuits",icon:"🔌",title:"Schaltungen & Fehlersuche",level:"Level 3",time:"50 min",desc:"Reihen- und Parallelschaltung, Schutzorgane und systematische Fehlersuche.",lessons:["Reihenschaltung","Parallelschaltung","LS-Schalter und RCD","Fehler systematisch eingrenzen"],body:"Gute Fehlersuche beginnt mit Sicherheit, Beobachtung und einer klaren Hypothese. Danach werden Messungen gezielt eingesetzt. Niemals planlos messen oder Schutzorgane überbrücken."},
{id:"practical",icon:"🧰",title:"Praxiswerkstatt",level:"Hands-on",time:"60 min",desc:"Virtuelle Übungen zu Kabeln, Klemmen, Verteilung, Messung und Dokumentation.",lessons:["Leiter vorbereiten","Klemmen und Verbindungen","Verteilung aufbauen","Prüfen und dokumentieren"],body:"Die virtuelle Werkstatt trainiert Handlungsabläufe ohne reale elektrische Gefährdung. Sie ist ein Lernsimulator, kein Ersatz für praktische Ausbildung unter qualifizierter Aufsicht."},
{id:"advanced",icon:"⚙️",title:"Aufbauwissen",level:"Advanced",time:"55 min",desc:"Drehstrom, Motorsteuerung, KNX, PV, Wärmepumpe und Elektromobilität.",lessons:["Drehstrom-Grundlagen","Motorsteuerung","Smart Home","PV und Wallbox"],body:"Fortgeschrittene Elektrotechnik verbindet Grundlagen mit konkreten Systemen. Planung, Auswahl, Prüfung und Inbetriebnahme realer Anlagen erfordern aktuelle Fachunterlagen und qualifizierte Fachkräfte."}
];
var safetyRules=[
["Freischalten","Alle aktiven Leiter des betreffenden Anlagenteils freischalten."],
["Gegen Wiedereinschalten sichern","Verhindern, dass während der Arbeit unbeabsichtigt wieder eingeschaltet wird."],
["Spannungsfreiheit feststellen","Mit geeignetem und geprüftem Spannungsprüfer feststellen, dass keine gefährliche Spannung anliegt."],
["Erden und kurzschließen","Soweit für die konkrete Anlage und Arbeit erforderlich, fachgerecht erden und kurzschließen."],
["Benachbarte unter Spannung stehende Teile sichern","Benachbarte Gefahrenstellen abdecken oder abschranken."]
];
var quizzes=[
{id:"q1",q:"Welche Formel beschreibt das Ohmsche Gesetz?",a:["P = U × I","U = R × I","I = P × R","R = P × U"],c:1},
{id:"q2",q:"Was ist vor dem Beginn einer Arbeit an einem freigeschalteten Stromkreis zu prüfen?",a:["Nur die Sicherungsgröße","Die Spannungsfreiheit","Nur die Kabelfarbe","Nur die Raumtemperatur"],c:1},
{id:"q3",q:"Welche Aufgabe hat der Schutzleiter PE?",a:["Er erhöht die Netzspannung","Er dient dem Schutz gegen elektrischen Schlag","Er ersetzt immer den Neutralleiter","Er misst den Strom"],c:1},
{id:"q4",q:"Was ist bei einer systematischen Fehlersuche zuerst wichtig?",a:["Schutzorgane überbrücken","Sicherheit herstellen und Problem eingrenzen","Sofort alle Leitungen tauschen","Ohne Messplan messen"],c:1},
{id:"q5",q:"Welche Einheit hat elektrische Leistung?",a:["Ohm","Ampere","Watt","Volt"],c:2},
{id:"q6",q:"Welche Messung darf nicht einfach parallel über eine Spannungsquelle angeschlossen werden?",a:["Strommessung","Spannungsmessung","Durchgangsprüfung","Widerstandsmessung"],c:0}
];
var labs=[
{id:"ohm",title:"Ohm’s Law Reasoning",tag:"Calculation Lab",desc:"Solve a guided current question and explain the relationship between voltage, resistance and current.",action:"guided"},
{id:"safety",title:"Safe Isolation Sequence",tag:"Safety Lab",desc:"Review the five safety rules and choose the correct first step for a practical scenario.",action:"safety"},
{id:"fault-open",title:"Open-Conductor Fault",tag:"Fault Lab",desc:"Choose a safe diagnostic next step before selecting any measurement.",action:"fault"},
{id:"inspection",title:"Distribution Review",tag:"Inspection Lab",desc:"Work through the key documentation, protection, conductor and labeling checks.",action:"inspection"},
{id:"meter",title:"Multimeter Setup",tag:"Measurement Lab",desc:"Choose a measurement mode and review the required instrument and connection checks.",action:"meter"},
{id:"diagram",title:"Diagram to Reality",tag:"Diagram Lab",desc:"Trace the functional path from supply through protection and conductors to a load.",action:"diagram"},
{id:"fault2",title:"RCD Trip Investigation",tag:"Fault Lab",desc:"Practise a safe, evidence-led investigation of a recurring residual-current-device trip.",action:"fault"}
];
const legacyLabIds={lab1:"ohm",lab2:"safety",lab3:"fault-open",lab4:"inspection"};
state.labDone=[...new Set((state.labDone||[]).map(function(id){return legacyLabIds[id]||id}))];
var terms=[
["L1 / L2 / L3","Außenleiter eines Drehstromsystems."],["N","Neutralleiter. Funktion und Situation müssen anhand des Systems bewertet werden."],["PE","Schutzleiter als Bestandteil der Schutzmaßnahme gegen elektrischen Schlag."],["LS-Schalter","Leitungsschutzschalter zum Schutz von Stromkreisen insbesondere vor Überlast und Kurzschluss."],["RCD / FI","Fehlerstrom-Schutzeinrichtung, die einen Differenzstrom erkennt und abschalten kann."],["Schuko","Umgangssprachliche Bezeichnung für ein Stecksystem mit Schutzkontakt."],["Durchgangsprüfung","Prüfung, ob zwischen zwei Messpunkten eine leitende Verbindung besteht."],["Inbetriebnahme","Kontrollierter Prozess zur Prüfung und Übergabe einer Anlage oder eines Anlagenteils."],["VDE","Fachverband und Bezeichnung für ein umfangreiches Normen- und Regelwerk im Elektrotechnikbereich."],["NYM-J","Typische Mantelleitung für feste Installationen; Auswahl und Verwendung müssen zur Anwendung passen."]
];
function progress(){var total=modules.length+quizzes.length+safetyRules.length+labs.length;var done=state.completed.length+Object.keys(state.quiz).length+(state.safety?safetyRules.length:0)+state.labDone.length;return Math.min(100,Math.round(done/total*100))}
function updateProgress(){var p=progress();document.getElementById("sideProgress").textContent=p+"%";document.getElementById("sideProgressBar").style.width=p+"%"}
function head(t,s){return '<div class="section-head"><h3>'+t+'</h3><span>'+s+'</span></div>'}
function moduleRow(m){var done=state.completed.indexOf(m.id)>=0;return '<div class="module"><div class="module-icon">'+m.icon+'</div><div><h4>'+m.title+' '+(done?'<span class="pill green">✓</span>':'')+'</h4><small>'+m.level+' · '+m.time+'<br>'+m.desc+'</small></div><div class="module-progress"><strong>'+(done?100:0)+'%</strong><div class="meter"><i style="width:'+(done?100:0)+'%"></i></div><button class="btn secondary" style="margin-top:7px;padding:7px 9px;font-size:10px" onclick="openModule(\''+m.id+'\')">Öffnen</button></div></div>'}
function skills(){var a=[["Grundlagen",state.completed.indexOf("basics")>=0?100:25],["Installation",state.completed.indexOf("germany")>=0?100:10],["Sicherheit",state.safety?100:40],["Fehlersuche",state.completed.indexOf("circuits")>=0?100:15],["Praxis",state.completed.indexOf("practical")>=0?100:5]];return a.map(function(x){return '<div class="skill"><span>'+x[0]+'</span><div class="meter"><i style="width:'+x[1]+'%"></i></div><b>'+x[1]+'%</b></div>'}).join("")}
function layout(t,h){document.getElementById("pageTitle").textContent=t;document.getElementById("view").innerHTML=h;updateProgress()}
function dashboard(){var p=progress(),done=modules.filter(function(m){return state.completed.indexOf(m.id)>=0}).length;var checks=safetyRules.map(function(r,i){return '<label class="check"><input type="checkbox" data-check="'+i+'" '+(state.checks[i]?"checked":"")+'><span><b>'+r[0]+'</b><br><span class="muted">'+r[1]+'</span></span></label>'}).join("");var nextView=state.safety?"learn":"safety";var nextTitle=state.safety?"Nächstes Modul":"Safety Gate abschließen";var nextDesc=state.safety?"Setze deinen Lernpfad fort.":"Sicherheitsgrundlagen sind Voraussetzung für Praxisübungen.";layout("Dashboard",'<section class="hero"><div><span class="eyebrow">VoltPRo Academy · ein Projekt von Hephzibah Behulah</span><h2>Vom Anfänger zur sicheren Fachkraft.</h2><p>VoltPRo Academy verbindet verständliche Theorie, deutsche Fachbegriffe, Sicherheitsregeln, virtuelle Übungen und Prüfungen in einem Lernpfad. Arbeite in deinem Tempo und baue Kompetenz Schritt für Schritt auf.</p><div class="hero-actions"><button class="btn primary" onclick="location.href=&quot;simulator.html&quot;">⚡ '+(state.language==="EN"?"Open Simulator":"Simulator öffnen")+'</button><button class="btn secondary" onclick="nav(&quot;learn&quot;)">Lernen starten</button><button class="btn secondary" onclick="nav(&quot;safety&quot;)">Safety Gate</button></div></div><div class="ring" style="--p:'+p+'%"><strong>'+p+'%</strong></div></section><section class="launch-grid" aria-label="Schnellstart"><a class="launch-card launch-featured" href="simulator.html"><span class="launch-icon">⚡</span><span class="launch-copy"><small>SIMULATION / KERNWERKZEUG</small><strong>VoltPRo Simulator</strong><span>Schaltungen entwerfen, Messwerte prüfen und Fehler systematisch untersuchen.</span></span><span class="launch-arrow" aria-hidden="true">↗</span></a><button class="launch-card" type="button" onclick="nav(&quot;learn&quot;)"><span class="launch-icon">▣</span><span class="launch-copy"><small>LERNEN</small><strong>Lernmodule</strong><span>Theorie und Fachbegriffe Schritt für Schritt aufbauen.</span></span><span class="launch-arrow" aria-hidden="true">↗</span></button><button class="launch-card" type="button" onclick="nav(&quot;labs&quot;)"><span class="launch-icon">⌘</span><span class="launch-copy"><small>PRAXIS</small><strong>Virtuelle Labore</strong><span>Übungen durchführen und Konzepte praktisch erkunden.</span></span><span class="launch-arrow" aria-hidden="true">↗</span></button><a class="launch-card" href="engineering.html"><span class="launch-icon">∑</span><span class="launch-copy"><small>WERKZEUGE</small><strong>Engineering Tools</strong><span>Berechnungen und technische Hilfsmittel direkt öffnen.</span></span><span class="launch-arrow" aria-hidden="true">↗</span></a><a class="launch-card" href="breadboard.html"><span class="launch-icon">▦</span><span class="launch-copy"><small>BREADBOARD / ELEKTRONIK</small><strong>Breadboard Electronics</strong><span>Arduino-Schaltungen auf dem BB400 aufbauen, verdrahten und simulieren.</span></span><span class="launch-arrow" aria-hidden="true">↗</span></a></section><section class="vp-public-overview" aria-label="VoltPRo Academy Überblick"><div class="vp-overview-copy"><span class="vp-overview-kicker">ÜBER DAS PROJEKT</span><h3>Elektrotechnik praktisch verstehen.</h3><p>VoltPRo Academy ist eine browserbasierte Lern- und Simulationsplattform von Hephzibah Behulah. Sie verbindet Schaltungsentwurf, elektrische Steuerungen und Automatisierung mit geführtem technischem Lernen.</p></div><div class="vp-overview-capabilities"><div><b>01</b><span>Schaltungsentwurf &amp; Simulation</span></div><div><b>02</b><span>Schaltschränke &amp; Automatisierung</span></div><div><b>03</b><span>Lernmodule &amp; Engineering-Tools</span></div></div><div class="vp-overview-flow" aria-label="Lernablauf"><span>LERNEN</span><i>→</i><span>AUFBAUEN</span><i>→</i><span>SIMULIEREN</span><i>→</i><span>UNTERSUCHEN</span><i>→</i><span>VERSTEHEN</span></div></section><section class="stats"><div class="stat accent"><small>Gesamtfortschritt</small><strong>'+p+'%</strong><span class="muted">Academy-Pfad</span></div><div class="stat"><small>Module</small><strong>'+done+'/'+modules.length+'</strong><span class="muted">abgeschlossen</span></div><div class="stat"><small>Quiz</small><strong>'+Object.keys(state.quiz).length+'/'+quizzes.length+'</strong><span class="muted">beantwortet</span></div><div class="stat"><small>Safety</small><strong>'+(state.safety?"✓":"—")+'</strong><span class="muted">'+(state.safety?"zertifiziert":"noch offen")+'</span></div></section><div class="grid2"><section class="card">'+head("Dein Lernpfad","6 Kernmodule")+modules.map(moduleRow).join("")+'</section><section class="card">'+head("Safety Check","täglich wiederholen")+checks+'<button class="btn secondary" onclick="nav(&quot;safety&quot;)">Safety Lab öffnen</button></section></div><div class="grid2"><section class="card">'+head("Skill Ladder","Kompetenzprofil")+skills()+'</section><section class="card">'+head("Nächste Schritte","empfohlen")+'<div class="catalog"><div class="catalog-item" onclick="nav(&quot;'+nextView+'&quot;)"><div><strong>'+nextTitle+'</strong><small>'+nextDesc+'</small></div><span class="pill amber">START</span></div><div class="catalog-item" onclick="nav(&quot;quiz&quot;)"><div><strong>Wissenscheck</strong><small>Teste Grundlagen und erkenne Wissenslücken.</small></div><span class="pill">QUIZ</span></div></div></section></div>');bindChecks()}
function bindChecks(){document.querySelectorAll("[data-check]").forEach(function(e){e.addEventListener("change",function(){state.checks[Number(e.dataset.check)]=e.checked;save()})})}
function learn(){layout("Learning Path",'<div class="hero" style="margin-bottom:18px"><div><span class="eyebrow">LEARNING PATH</span><h2>Curriculum</h2><p>Öffne ein Modul, lerne die Inhalte und markiere es erst danach als abgeschlossen. Die Academy führt vom Fundament über Sicherheit und Installation bis zu Fehlersuche und Aufbauwissen.</p></div></div><section class="grid2"><div class="card">'+head("Module","Fundament → Praxis")+modules.map(moduleRow).join("")+'</div><div class="card">'+head("Lernprinzip","Learn → See → Practise")+["Verstehen: einfache Erklärung ohne unnötigen Jargon.","Sehen: Begriffe mit realen Beispielen verbinden.","Üben: sichere Simulation statt blindes Auswendiglernen.","Prüfen: Quiz und praktische Aufgabe.","Wiederholen: Schwächen gezielt erneut bearbeiten."].map(function(x,i){var z=x.split(":");return '<div class="rule"><div class="rule-num">'+(i+1)+'</div><div><strong>'+z[0]+'</strong><p>'+z.slice(1).join(":")+'</p></div></div>'}).join("")+'</div></section>')}
function safety(){layout("Safety & Standards",'<div class="safety-gate"><h3>⚠ Safety Gate</h3><p class="muted">Diese Academy ist ein Lernsystem. Arbeiten an realen elektrischen Anlagen dürfen nur im Rahmen der erforderlichen Qualifikation, Befugnis, Schutzmaßnahmen und fachlichen Aufsicht erfolgen.</p><button class="btn primary" onclick="startSafety()">Safety Certification starten</button></div><section class="card">'+head("Die fünf Sicherheitsregeln","Grundlage für sicheres Arbeiten")+safetyRules.map(function(r,i){return '<div class="rule"><div class="rule-num">'+(i+1)+'</div><div><strong>'+r[0]+'</strong><p>'+r[1]+'</p></div><span class="pill '+(state.safety?"green":"")+'">'+(state.safety?"✓ VERIFIED":"CORE")+'</span></div>'}).join("")+'</section>')}
function startSafety(){if(confirm("Safety Certification: Have you read and understood all five rules? This confirms learning, not professional authorization.")){state.safety=true;save();toast("Safety gate completed");render()}}
function labsView(){layout("Virtual Labs",'<div class="hero" style="margin-bottom:18px"><div><span class="eyebrow">PRACTICE WITHOUT LIVE VOLTAGE</span><h2>Virtual Workshop</h2><p>Trainiere Denk- und Prüfabläufe in sicheren Simulationen. Keine reale Anlage wird angesteuert.</p></div></div><section class="lab-grid">'+labs.map(function(l){return '<article class="lab-card"><span class="pill">'+l.tag+'</span><h3>'+l.title+'</h3><p>'+l.desc+'</p><button class="btn primary" onclick="openLab(\''+l.action+'\',\''+l.id+'\')">Lab starten</button> '+(state.labDone.indexOf(l.id)>=0?'<span class="pill green">✓ erledigt</span>':'')+'</article>'}).join("")+'</section>')}
function quiz(){layout("Knowledge Checks",'<div class="hero" style="margin-bottom:18px"><div><span class="eyebrow">KNOWLEDGE CHECK</span><h2>Prüfe dein Wissen.</h2><p>Jede Frage kann einmal beantwortet werden. Danach siehst du sofort die richtige Lösung.</p></div></div><section class="card">'+quizzes.map(function(q,i){var ans=state.quiz[q.id];return '<article class="quiz-card"><p>'+(i+1)+'. '+q.q+'</p><div class="answers">'+q.a.map(function(a,j){return '<button class="answer '+(ans!==undefined?(j===q.c?"correct":j===ans?"wrong":""):"")+'" '+(ans!==undefined?"disabled":"")+' onclick="answerQuiz(\''+q.id+'\','+j+')">'+String.fromCharCode(65+j)+'. '+a+'</button>'}).join("")+'</div>'+(ans!==undefined?'<small class="muted">'+(ans===q.c?"Richtig. Gute Grundlage.":"Nicht richtig. Wiederhole das passende Modul und versuche es später erneut.")+'</small>':"")+'</article>'}).join("")+'</section>')}
function answerQuiz(id,n){if(state.quiz[id]!==undefined)return;state.quiz[id]=n;save();render();toast("Answer saved")}
function calculatorHTML(){return '<div class="calc"><div class="field"><label>U Spannung (V)</label><input id="cu" type="number" placeholder="230"></div><div class="field"><label>R Widerstand (Ω)</label><input id="cr" type="number" placeholder="46"></div><div class="field"><label>I Strom (A)</label><input id="ci" type="number" placeholder="5"></div></div><button class="btn primary" style="margin-top:12px" onclick="calcOhm()">Berechnen</button><div id="calcResult" class="result">Gib zwei Werte ein. Der dritte wird berechnet.</div>'}
function calcOhm(){var u=parseFloat(document.getElementById("cu").value),r=parseFloat(document.getElementById("cr").value),i=parseFloat(document.getElementById("ci").value),msg="Bitte genau zwei gültige Werte eingeben.";if([u,r,i].filter(Number.isFinite).length===2){if(!Number.isFinite(u))msg="U = "+(r*i).toFixed(2)+" V";else if(!Number.isFinite(r))msg="R = "+(u/i).toFixed(2)+" Ω";else msg="I = "+(u/r).toFixed(2)+" A"}document.getElementById("calcResult").textContent=msg}
function reference(){expandedReference()}
function settings(){layout("Settings",'<section class="grid2"><div class="card">'+head("Student profile","lokal im Browser")+'<div class="field"><label>Name</label><input id="nameInput" value="'+state.student.replace(/"/g,"&quot;")+'" maxlength="40"></div><button class="btn primary" style="margin-top:10px" onclick="saveName()">Speichern</button></div><div class="card">'+head("Lernfortschritt","persistent")+'<p class="muted">Dein Fortschritt wird nur in diesem Browser per localStorage gespeichert. Es gibt derzeit kein Konto und keinen Server.</p><button class="btn secondary" onclick="resetProgress()">Fortschritt zurücksetzen</button></div></section>')}
function saveName(){state.student=document.getElementById("nameInput").value.trim()||"Student";save();document.getElementById("studentName").textContent=state.student;toast("Profile saved");render()}
function resetProgress(){if(confirm("Reset all learning progress in this browser?")){localStorage.removeItem(KEY);location.reload()}}
function openModule(id){var m=modules.find(function(x){return x.id===id});var done=state.completed.indexOf(id)>=0;document.getElementById("lessonModal").innerHTML='<div class="modal"><button class="btn secondary modal-close" onclick="lessonDialog.close()">Schließen</button><span class="eyebrow">'+m.level+'</span><h2>'+m.icon+' '+m.title+'</h2><p>'+m.body+'</p><h3>Lernziele</h3><ul>'+m.lessons.map(function(x){return "<li>"+x+"</li>"}).join("")+'</ul><div class="terminal">VOLTPRO / '+m.id.toUpperCase()+'\nSTATUS: '+(done?"COMPLETED":"IN PROGRESS")+'\nNEXT: PRACTISE → ASSESS</div><button class="btn primary" onclick="completeModule(\''+m.id+'\')">'+(done?"Abgeschlossen ✓":"Als gelernt markieren")+'</button></div>';lessonDialog.showModal()}
function completeModule(id){if(state.completed.indexOf(id)<0){state.completed.push(id);save();toast("Module completed")}lessonDialog.close();render()}
function openLab(action,id){var h='<div class="modal"><button class="btn secondary modal-close" onclick="lessonDialog.close()">Schließen</button>';if(action==="calculator")h+='<span class="eyebrow">LAB 01</span><h2>Ohmsches Gesetz</h2><p>Berechne den fehlenden Wert aus zwei bekannten Größen.</p>'+calculatorHTML();else if(action==="safety")h+='<span class="eyebrow">LAB 02</span><h2>Sichere Isolation</h2><p>Wiederhole die fünf Sicherheitsregeln und ihren Zweck.</p><ol>'+safetyRules.map(function(r){return "<li><b>"+r[0]+"</b> — "+r[1]+"</li>"}).join("")+'</ol>';else if(action==="fault")h+='<span class="eyebrow">LAB 03</span><h2>Fehler: Offener Leiter</h2><p>Symptom: Ein Verbraucher bleibt dunkel. Arbeite vom sicheren Zustand über Sichtprüfung zur gezielten Messung.</p><div class="catalog"><div class="catalog-item"><div><strong>1. Sicherheit herstellen</strong><small>Situation sichern und keine unkontrollierten Messungen durchführen.</small></div></div><div class="catalog-item"><div><strong>2. Sichtprüfung</strong><small>Schalterstellung, Anschlüsse, Beschädigungen und Dokumentation prüfen.</small></div></div><div class="catalog-item"><div><strong>3. Systematisch messen</strong><small>Mit geeignetem Messgerät und korrekter Messmethode den Fehler eingrenzen.</small></div></div></div>';else h+='<span class="eyebrow">LAB 04</span><h2>Verteilung prüfen</h2><p>Prüfe gedanklich: Beschriftung vorhanden? Schutzorgane passend? Leiter sicher geklemmt? Dokumentation vollständig?</p>';h+='<button class="btn primary" style="margin-top:14px" onclick="finishLab(\''+id+'\')">Lab abschließen</button></div>';document.getElementById("lessonModal").innerHTML=h;lessonDialog.showModal()}
function finishLab(id){if(state.labDone.indexOf(id)<0)state.labDone.push(id);save();lessonDialog.close();toast("Lab completed");render()}
function render(){document.querySelectorAll(".nav-item[data-view]").forEach(function(b){b.classList.toggle("active",b.dataset.view===state.view)});document.getElementById("studentName").textContent=state.student;var map={dashboard:dashboard,learn:learn,safety:safety,labs:labsView,quiz:quiz,exam:window.expandedExam||dashboard,reference:reference,settings:settings};(map[state.view]||dashboard)()}
document.querySelectorAll(".nav-item[data-view]").forEach(function(b){b.addEventListener("click",function(){nav(b.dataset.view);document.getElementById("sidebar").classList.remove("open")})});
document.getElementById("mobileMenu").addEventListener("click",function(){document.getElementById("sidebar").classList.toggle("open")});
document.getElementById("resetBtn").addEventListener("click",resetProgress);
document.getElementById("languageBtn").addEventListener("click",function(){state.language=state.language==="DE"?"EN":"DE";document.getElementById("languageBtn").textContent=state.language;toast(state.language==="DE"?"Deutsch aktiviert":"English mode selected")});
document.addEventListener("click",function(e){if(!e.target.closest(".search")&&!e.target.closest(".search-results"))document.querySelector(".search-results")?.remove()});
document.getElementById("globalSearch").addEventListener("input",function(e){var q=e.target.value.trim().toLowerCase();document.querySelector(".search-results")?.remove();if(!q)return;var hits=modules.map(function(m){return{t:m.title,d:m.desc,v:"learn"}}).concat(terms.map(function(t){return{t:t[0],d:t[1],v:"reference"}}),labs.map(function(l){return{t:l.title,d:l.desc,v:"labs"}})).filter(function(x){return(x.t+" "+x.d).toLowerCase().indexOf(q)>=0}).slice(0,7);var box=document.createElement("div");box.className="search-results";box.innerHTML=hits.length?hits.map(function(h){return '<button><b>'+h.t+'</b><br><small class="muted">'+h.d+'</small></button>'}).join(""):'<div class="empty">Keine Treffer</div>';document.querySelector(".topbar").appendChild(box);box.querySelectorAll("button").forEach(function(b,i){b.onclick=function(){nav(hits[i].v);box.remove();e.target.value=""}})});
var lessonDialog=document.getElementById("lessonDialog");
/* ===== VoltPRo Academy 2026 Expansion ===== */
modules.push(
{id:"exam",icon:"🎓",level:"Certification",time:"45 min",title:{DE:"Gesellenprüfung Training",EN:"Journeyman Exam Training"},desc:{DE:"Originale Prüfungssimulation zu Theorie, Sicherheit, Berechnung und Fehlersuche.",EN:"Original practice across theory, safety, calculations and troubleshooting."},lessons:["Theory","Safety","Calculations","Troubleshooting"],body:"This is an original training simulation. It is not an official IHK or HWK exam paper."},
{id:"advanced2",icon:"☀️",level:"Advanced",time:"50 min",title:{DE:"Energie & Zukunft",EN:"Energy & Future"},desc:{DE:"PV, Wärmepumpe, Speicher, E-Mobilität und Energieeffizienz.",EN:"PV, heat pumps, storage, e-mobility and energy efficiency."},lessons:["PV basics","Heat pumps","Battery storage","EV charging"],body:"Advanced energy systems require system-specific design, protection, commissioning and current technical documentation."}
);
const examQuestions=[
{id:"e1",q:"A 230 V load draws 5 A. What is its approximate resistance?",a:["46 Ω","1150 Ω","0.023 Ω","235 Ω"],c:0},
{id:"e2",q:"Which safety rule verifies that the circuit is actually de-energized?",a:["Secure against reconnection","Verify absence of voltage","Cover adjacent parts","Earth and short-circuit"],c:1},
{id:"e3",q:"A protective device repeatedly trips. What is the correct training response?",a:["Fit a larger device immediately","Bypass it","Investigate the cause safely and systematically","Hold it on"],c:2},
{id:"e4",q:"What does PE identify?",a:["Protective conductor","Power electronics","Primary energy","Phase equalizer"],c:0},
{id:"e5",q:"At 230 V and 2 A, electrical power is:",a:["115 W","232 W","460 W","23 W"],c:2},
{id:"e6",q:"Before measuring an unfamiliar circuit you should:",a:["Use any setting","Confirm instrument rating, leads, terminals and method","Bridge terminals","Disable protection"],c:1}
];
window.examQuestions=examQuestions;
const toolCatalog=[
["Multimeter","Voltage, current, resistance and continuity measurement.","Confirm CAT rating, leads, terminals, range and measurement method."],
["Two-pole voltage tester / Duspol","Proving absence of voltage where the procedure requires it.","Use a suitable tested instrument and follow the applicable procedure."],
["Insulation tester","Insulation resistance testing.","Use on de-energized equipment and follow equipment requirements."],
["Torque screwdriver","Tightening terminals to a specified torque.","Use the manufacturer's specified torque and correct bit."],
["VDE screwdriver","Insulated screwdriver for suitable electrical work.","Inspect insulation and use only within its rating."],
["Wire stripper","Removing insulation from conductors.","Use the correct conductor range and avoid nicking copper."],
["Crimping tool","Making suitable ferrule/crimp connections.","Use the correct terminal, die and conductor size."],
["Side cutter","Cutting conductors.","Control cut-off pieces and use appropriate eye protection."],
["Cable knife","Preparing cable sheaths.","Control blade direction and protect conductor insulation."],
["Clamp meter","Measuring current without opening the circuit.","Verify rating and clamp only the intended conductor(s)."],
["Phase sequence tester","Checking phase sequence.","Follow instrument instructions and the applicable safety procedure."],
["Terminal block","Organised conductor connections.","Verify product rating, conductor type and tightening requirements."]
];
const componentCatalog=[
["LS-Schalter / MCB","Overcurrent protective device for a circuit."],
["RCD / FI","Residual-current protective device."],
["Schuko-Steckdose","Common German socket system with protective contact."],
["WAGO-Klemme","Spring terminal system; exact product/application determines suitability."],
["NYM-J","Common fixed-installation cable family; selection depends on application."],
["Verteilerkasten","Distribution enclosure for protective and switching equipment."],
["Aderendhülse","Ferrule for suitable stranded conductor terminations."],
["Schütz / Contactor","Electromagnetically operated switching device."],
["Kabelkanal","Cable routing/protection system."],
["Klemmenblock","Organised terminal system."]
];
const formulaLibrary=[
["Ohm","U = R × I","Voltage = resistance × current"],
["Current","I = U / R","Current from voltage and resistance"],
["Resistance","R = U / I","Resistance from voltage and current"],
["Power","P = U × I","Electrical power"],
["Power","P = I² × R","Power from current and resistance"],
["Power","P = U² / R","Power from voltage and resistance"],
["Energy","E = P × t","Energy from power and time"],
["Series resistance","Rₜ = R₁ + R₂ + …","Resistances add in series"],
["Parallel resistance","1/Rₜ = 1/R₁ + 1/R₂ + …","Reciprocal sum for parallel resistors"],
["Three-phase power","P ≈ √3 × U × I × cosφ","Use with correct line values and assumptions"]
];
const standardsLibrary=[
["DIN VDE 0100","Low-voltage electrical installations; verify the current applicable part and edition."],
["DIN VDE 0100-410","Protection against electric shock; verify current edition."],
["DIN VDE 0100-520","Selection and erection of wiring systems; verify current edition."],
["DIN VDE 0100-600","Initial verification of low-voltage electrical installations."],
["DIN EN 60617","Graphical symbols for diagrams; use current applicable symbols."],
["DGUV","German occupational safety guidance; always use the current publication."],
["VDE / DKE","Use official current standards and technical rules for real design, testing and installation."],
["IHK / HWK","Use the responsible chamber's current examination information; this app does not reproduce official papers."]
];
/* Virtual Labs now use a single, deduplicated list defined near the learning data. */
function localModuleName(m){return m.title[state.language==="EN"?"EN":"DE"]||m.title.DE}
function localModuleDesc(m){return m.desc[state.language==="EN"?"EN":"DE"]||m.desc.DE}
function expandedReference(){
 layout("Reference Library",'<div class="grid2"><section class="card">'+head("Formula Library","concepts and units")+formulaLibrary.map(function(f){return '<div class="term"><strong>'+f[0]+'</strong><p><b>'+f[1]+'</b><br>'+f[2]+'</p></div>'}).join("")+'</section><section class="card">'+head("Standards & Guidance","verify current editions")+standardsLibrary.map(function(s){return '<div class="term"><strong>'+s[0]+'</strong><p>'+s[1]+'</p></div>'}).join("")+'<div class="safety-gate"><b>Need to calculate?</b><p>Calculators belong in Engineering Tools. Guided project exercises, fault scenarios, tutorials and the wider technical index belong in Practical Workbench.</p><a class="btn primary" href="engineering.html" style="display:inline-block;text-decoration:none;margin:5px 5px 0 0">Open Engineering Tools ↗</a><a class="btn secondary" href="academy-workbench.html" style="display:inline-block;text-decoration:none;margin-top:5px">Open Practical Workbench ↗</a></div></section></div>');
}
function expandedTools(){
 layout("Tools & Equipment",'<div class="hero" style="margin-bottom:18px"><div><span class="eyebrow">TOOL CATALOG</span><h2>Professional tools and devices</h2><p>Purpose, safe-use principles and limitations. Always follow manufacturer instructions and applicable requirements.</p></div></div><section class="grid2"><div class="card">'+head("Tool Catalog",toolCatalog.length+" tools")+toolCatalog.map(function(t,i){return '<div class="catalog-item"><div><strong>'+t[0]+'</strong><small>'+t[1]+'</small><small><b>Safety:</b> '+t[2]+'</small></div><button class="btn secondary" onclick="showTool('+i+')">Learn</button></div>'}).join("")+'</div><div class="card">'+head("Component Lexicon",componentCatalog.length+" components")+componentCatalog.map(function(c){return '<div class="term"><strong>'+c[0]+'</strong><p>'+c[1]+'</p></div>'}).join("")+'</div></section>');
}
function showTool(i){
 const t=toolCatalog[i];
 state.toolSeen=state.toolSeen||[];
 if(!state.toolSeen.includes(i))state.toolSeen.push(i);
 save();
 document.getElementById("lessonModal").innerHTML='<div class="modal"><button class="btn secondary modal-close" onclick="lessonDialog.close()">Close</button><span class="eyebrow">TOOL TRAINING</span><h2>🧰 '+t[0]+'</h2><p>'+t[1]+'</p><div class="safety-gate"><b>Safety warning</b><p>'+t[2]+'</p></div><div class="animation-card"><div class="pulse-icon">⚡</div><div><b>Instruction animation</b><small>Inspect → select → verify → use → document.</small></div></div><button class="btn primary" onclick="lessonDialog.close()">Complete</button></div>';
 lessonDialog.showModal();
}
function expandedTutor(){
 const suggestions=["Explain Ohm’s law","What belongs in the VoltPRo Simulator?","Where are the fault scenarios and challenges?","How do I calculate voltage drop?","Explain the five safety rules","Search external sources for IEC 60364 overview"];
 layout("AI Tutor",'<section class="grid2"><div class="card"><span class="eyebrow">PROJECT-AWARE LEARNING ASSISTANT</span><h2>Ask VoltPRo Tutor</h2><p class="muted">The tutor can use VoltPRo’s project map, lessons, labs, simulator and engineering workspaces. Enable external lookup to retrieve public reference summaries. Safety-critical answers still require qualified review and current official documents.</p><label class="check"><input id="tutorExternal" type="checkbox"><span><b>Search external sources</b><br><span class="muted">Fetch public Wikipedia reference results and show source links when available.</span></span></label><div id="chatLog" class="chat-log" aria-live="polite"><div class="chat tutor">I can explain the Academy, help choose the right workspace, answer electrical theory questions and look up public reference material.</div></div><form class="chat-input" onsubmit="event.preventDefault();askTutorExpanded()"><input id="tutorInput" placeholder="Ask about VoltPRo or electrical engineering…" autocomplete="off" aria-label="Ask VoltPRo Tutor"><button class="btn primary" id="tutorAskBtn" type="submit">Ask</button></form></div><div class="card">'+head("Suggested questions","project → practice")+suggestions.map(function(x){return '<button type="button" class="catalog-item tutor-suggestion" onclick="useTutorSuggestion(this)" style="width:100%;font:inherit;color:inherit;text-align:left"><strong>'+x+'</strong><span class="pill">ASK</span></button>'}).join("")+'<div class="safety-gate" style="margin-top:14px"><b>Source and safety policy</b><p>External snippets are references, not instructions. Verify current standards with the issuing organisation. The tutor cannot approve live work, certify an installation or infer component ratings from an image.</p></div></div></section>');
 if(Array.isArray(state.tutorLog)&&state.tutorLog.length){renderTutorLog()}
}
function useTutorSuggestion(button){const input=document.getElementById("tutorInput");if(input){input.value=button.querySelector("strong").textContent;askTutorExpanded()}}
function esc(value){return String(value==null?"":value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}
function renderTutorLog(){
 const log=document.getElementById("chatLog");if(!log)return;
 log.innerHTML=(state.tutorLog||[]).map(function(x){
   const body='<div class="chat '+(x.role==="user"?"user":"tutor")+'">'+esc(x.text)+'</div>';
   const sources=Array.isArray(x.sources)&&x.sources.length?'<div class="tutor-sources">'+x.sources.map(function(s){return '<a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.title||s.url)+'</a>'}).join("")+'</div>':"";
   return body+sources;
 }).join("");
 log.querySelectorAll(".chat").forEach((element,index)=>{const item=(state.tutorLog||[])[index];if(item?.plan)window.VoltProAssistantActions?.renderActions(element,item.plan);});
 log.scrollTop=log.scrollHeight;
}
function tutorReply(q){
 const s=q.toLowerCase();
 if(s.includes("voltage")||s.includes("spannung"))return "Voltage is electrical potential difference, measured in volts. It can drive current when a suitable circuit exists.";
 if(s.includes("ohm")||s.includes("resistance")||s.includes("widerstand"))return "Ohm's law is U = R × I. Example: 230 V ÷ 46 Ω = 5 A.";
 if(s.includes("rdc")||s.includes("fi"))return "An RCD/FI detects a residual or differential current condition and can disconnect the circuit. It does not replace correct design, inspection or other protective measures.";
 if(s.includes("mcb")||s.includes("ls"))return "An MCB/LS protects a circuit against overcurrent conditions within its intended characteristics. Repeated tripping must be investigated, not defeated.";
 if(s.includes("pe")||s.includes("schutzleiter"))return "PE identifies the protective conductor. Its role is part of the protective measure against electric shock.";
 if(s.includes("multimeter")||s.includes("meter"))return "Before measurement, confirm the quantity, instrument category/rating, leads, terminals, range and connection method. Never guess on an unfamiliar circuit.";
 if(s.includes("safety")||s.includes("sicherheit"))return "Five safety rules: isolate, secure against reconnection, verify absence of voltage, earth and short-circuit where required, and secure adjacent live parts.";
 if(s.includes("fault")||s.includes("fehler"))return "Use a safe diagnostic sequence: establish safe state → observe → inspect documentation and visible connections → form a hypothesis → choose an appropriate test → verify the result.";
 return "I can explain electrical foundations, formulas, tools, safety and troubleshooting. Try a more specific question.";
}
async function askTutorExpanded(){
 const e=document.getElementById("tutorInput"),q=e&&e.value.trim();if(!q)return;
 const button=document.getElementById("tutorAskBtn"),external=!!document.getElementById("tutorExternal")?.checked;
 e.value="";if(button)button.disabled=true;
 state.tutorLog=state.tutorLog||[];state.tutorLog.push({role:"user",text:q});
 state.tutorLog.push({role:"tutor",text:"Looking through project knowledge…"});
 renderTutorLog();
 const pending=state.tutorLog.length-1;
 let result=null;
 try{
   if(window.VoltProAssistant&&typeof window.VoltProAssistant.ask==="function")result=await window.VoltProAssistant.ask(q,{external});
 }catch(_){}
 if(!result||!result.answer)result={answer:tutorReply(q),sources:[],mode:"offline"};
 state.tutorLog[pending]={role:"tutor",text:result.answer+(result.mode==="offline"?"\n\nOffline fallback: the remote AI service did not return an answer.":""),sources:result.sources||[],plan:result.plan||null};
 state.tutorLog=state.tutorLog.slice(-12);save();renderTutorLog();
 if(button)button.disabled=false;
 if(e)e.focus();
}
function expandedExam(){
 const answered=Object.keys(state.exam||{}).length;
 layout("Exam Practice",'<div class="hero" style="margin-bottom:18px"><div><span class="eyebrow">GESELLENPRÜFUNG TRAINING</span><h2>Exam-style practice</h2><p>Practice questions covering calculation, safety, protective devices and troubleshooting. This is not an official IHK/HWK exam bank.</p></div><div class="stat"><small>Answered</small><strong>'+answered+'/'+examQuestions.length+'</strong></div></div><section class="card">'+examQuestions.map(function(q,i){const a=(state.exam||{})[q.id];return '<article class="quiz-card"><p>'+(i+1)+'. '+q.q+'</p><div class="answers">'+q.a.map(function(x,j){return '<button class="answer '+(a!==undefined?(j===q.c?"correct":j===a?"wrong":""):"")+'" '+(a!==undefined?"disabled":"")+' onclick="answerExamExpanded(\''+q.id+'\','+j+')">'+String.fromCharCode(65+j)+'. '+x+'</button>'}).join("")+'</div></article>'}).join("")+'</section>');
}
function answerExamExpanded(id,n){state.exam=state.exam||{};if(state.exam[id]!==undefined)return;state.exam[id]=n;save();expandedExam()}
function expandedAR(){
 layout("Component Learning",'<section class="card"><span class="eyebrow">CAMERA-ASSISTED COMPONENT LEARNING</span><h2>Camera learning exercise</h2><p class="muted">On supported devices you can select a camera image. This interface does not claim automated safety identification.</p><label class="upload-box"><input type="file" accept="image/*" capture="environment" onchange="inspectComponentImage(event)"><span>📷 Open camera / choose photo</span><small>Training candidates: MCB, RCD/FI, socket, terminal, contactor.</small></label><div id="imageResult" class="result">No image selected.</div></section>');
}
function inspectComponentImage(e){const f=e.target.files[0];if(!f)return;document.getElementById("imageResult").innerHTML="<b>Image received.</b><br>Use labels, shape, markings and manufacturer data to identify the component. Do not infer electrical rating, wiring or safety from an image alone."}
function renderExpandedLabs(){
 layout("Virtual Labs",'<div class="hero" style="margin-bottom:18px"><div><span class="eyebrow">SAFE-FAIL ENVIRONMENT</span><h2>Virtual Workshop</h2><p>These exercises are simulations. No real electrical circuit is energized or controlled.</p></div></div><section class="lab-grid">'+labs.map(function(l){return '<article class="lab-card"><span class="pill">'+l.tag+'</span><h3>'+l.title+'</h3><p>'+l.desc+'</p><button class="btn primary" onclick="expandedLab(\''+l.id+'\')">Start Lab</button> '+((state.labDone||[]).includes(l.id)?'<span class="pill green">✓ done</span>':'')+'</article>'}).join("")+'</section>');
}
function expandedLab(id){
 let h='<div class="modal"><button class="btn secondary modal-close" onclick="lessonDialog.close()">Close</button>';
 if(id==="ohm")h+='<span class="eyebrow">GUIDED CALCULATION</span><h2>Ohm’s Law Reasoning</h2><p>A 12 V source is connected to a 120 Ω resistive load. Calculate the current in amperes, then check your answer.</p><div class="field"><label>Current I (A)</label><input id="labOhmAnswer" type="number" step="any" placeholder="Your answer"></div><button class="btn secondary" type="button" onclick="checkOhmLab()">Check answer</button><div id="labOhmFeedback" class="result" aria-live="polite">Use I = U / R. Keep units consistent.</div>';
 else if(id==="safety")h+='<span class="eyebrow">SAFETY LAB</span><h2>Safe Isolation Sequence</h2><p>Before inspecting or testing an electrical circuit, select the safest first action.</p><div class="answers"><label class="answer"><input type="radio" name="safetyFirst" value="bypass"> Bypass the protective device and retry.</label><label class="answer"><input type="radio" name="safetyFirst" value="isolate"> Establish a safe state and follow the required isolation procedure.</label><label class="answer"><input type="radio" name="safetyFirst" value="replace"> Replace components before investigating the symptom.</label></div><button class="btn secondary" type="button" onclick="checkSafetyLab()">Check decision</button><div id="labSafetyFeedback" class="result" aria-live="polite">Choose the safest first action.</div><ol>'+safetyRules.map(function(r){return "<li><b>"+r[0]+"</b> — "+r[1]+"</li>"}).join("")+'</ol>';
 else if(id==="fault-open")h+='<span class="eyebrow">FAULT LAB</span><h2>Open-Conductor Fault</h2><p>A load is not operating and an open conductor is suspected. What should happen before selecting a measurement?</p><div class="answers"><label class="answer"><input type="radio" name="openFaultNext" value="bypass"> Bypass the protective device and retry.</label><label class="answer"><input type="radio" name="openFaultNext" value="safe"> Establish a safe state, record the symptom, and review documentation/visible conditions.</label><label class="answer"><input type="radio" name="openFaultNext" value="replace"> Replace all conductors without testing or inspection.</label></div><button class="btn secondary" type="button" onclick="checkOpenFaultLab()">Check decision</button><div id="labFaultFeedback" class="result" aria-live="polite">Choose a safe diagnostic next step.</div>';
 else if(id==="inspection")h+='<span class="eyebrow">INSPECTION LAB</span><h2>Distribution Review</h2><p>Use this educational review list to practise systematic inspection. It does not certify a real distribution board.</p><div class="catalog">'+["Circuit identification and documentation","Protective devices are identified and appropriate to the design","Conductor routing and visible condition","Terminal integrity assessed by a qualified person under safe conditions","Labels match the circuit documentation","Inspection and test records are complete"].map(function(x){return '<label class="check"><input type="checkbox"><span>'+x+'</span></label>'}).join("")+'</div>';
 else if(id==="meter")h+='<span class="eyebrow">METER LAB</span><h2>Multimeter Setup</h2><p>Choose the measurement mode, then review the safety principle for that mode.</p><div class="meter-sim"><button type="button" onclick="meterChoice(this,\'V\')">V</button><button type="button" onclick="meterChoice(this,\'A\')">A</button><button type="button" onclick="meterChoice(this,\'Ω\')">Ω</button><button type="button" onclick="meterChoice(this,\'CONT\')">Continuity</button></div><div id="meterResult" class="result">Select a mode.</div>';
 else if(id==="diagram")h+='<span class="eyebrow">DIAGRAM LAB</span><h2>Diagram → Reality</h2><div class="diagram-bridge"><div>Supply ── [Protection] ── Conductor ── (Load)</div><div class="arrow">↓</div><div>source → protective device → conductor → load</div></div><p>Trace the functional path and compare each symbol with the documented component. A diagram alone does not prove a real installation is safe.</p>';
 else if(id==="fault2")h+='<span class="eyebrow">FAULT LAB</span><h2>RCD Trip Investigation</h2><p>A residual-current device trips repeatedly. Do not repeatedly reset it or bypass it. Practise a safe investigation sequence:</p><div class="catalog">'+["Establish a safe state and follow local procedures","Record when and under what conditions the trip occurs","Review circuit information and visible/documented conditions","Have a qualified person select appropriate tests","Investigate the cause rather than defeating the protection","Verify and document before any return to service"].map(function(x,i){return '<div class="catalog-item"><strong>'+(i+1)+'. '+x+'</strong></div>'}).join("")+'</div>';
 h+='<button class="btn primary" style="margin-top:14px" onclick="finishExpandedLab(\''+id+'\')">Complete lab</button></div>';
 document.getElementById("lessonModal").innerHTML=h;lessonDialog.showModal();
}
function checkOhmLab(){
 const input=document.getElementById("labOhmAnswer"),out=document.getElementById("labOhmFeedback");if(!input||!out)return;
 const value=Number(input.value);
 if(input.value.trim()===""||!Number.isFinite(value)||value<0)out.textContent="Enter a valid non-negative current in amperes.";
 else out.textContent=Math.abs(value-0.1)<0.005?"Correct: I = U / R = 12 V / 120 Ω = 0.10 A.":"Not quite. Use I = U / R = 12 / 120, then check the units.";
}
function checkSafetyLab(){
 const selected=document.querySelector('input[name="safetyFirst"]:checked'),out=document.getElementById("labSafetyFeedback");if(!out)return;
 out.textContent=selected&&selected.value==="isolate"?"Correct. Establish the safe state and follow the required isolation procedure before further inspection or testing.":"Review the safety sequence. Never bypass protective devices or replace parts without investigating.";
}
function checkOpenFaultLab(){
 const selected=document.querySelector('input[name="openFaultNext"]:checked'),out=document.getElementById("labFaultFeedback");if(!out)return;
 out.textContent=selected&&selected.value==="safe"?"Correct. Establish a safe state, record the symptom, inspect available information, then let a qualified person choose appropriate tests.":"Not safe. Do not bypass protection or replace wiring without evidence. Start with safe state and structured observation.";
}


function meterChoice(btn,mode){document.querySelectorAll(".meter-sim button").forEach(function(b){b.classList.remove("selected")});btn.classList.add("selected");document.getElementById("meterResult").textContent=mode==="A"?"Current measurement requires the correct circuit method. Never connect a current input directly across a voltage source.":"Mode "+mode+" selected. Confirm terminals, CAT rating, range and method before measuring."}
function finishExpandedLab(id){state.labDone=state.labDone||[];if(!state.labDone.includes(id))state.labDone.push(id);save();lessonDialog.close();renderExpandedLabs();toast("Lab completed")}
function expandedSettings(){
 layout("Settings",'<section class="grid2"><div class="card">'+head("Student profile","local browser")+'<div class="field"><label>Name</label><input id="nameInput2" value="'+esc(state.student)+'" maxlength="40"></div><button class="btn primary" style="margin-top:10px" onclick="saveExpandedName()">Save</button></div><div class="card">'+head("Language","English")+'<button class="btn primary" onclick="switchLanguage()">English active</button></div><div class="card">'+head("Progress","local storage")+'<p class="muted">Learning data remains in this browser. No account or server is currently used.</p><button class="btn secondary" onclick="resetProgress()">Reset progress</button></div><div class="card">'+head("Legal learning notice","Germany")+'<p class="muted">Training only. Real electrical installation, inspection and commissioning must follow applicable law, standards, qualifications, authorization and responsible-person requirements.</p></div></section>');
}
function saveExpandedName(){state.student=document.getElementById("nameInput2").value.trim()||"Student";save();render();toast("Profile saved")}
function switchLanguage(){state.language="EN";save();toast("English is active");render()}
function expandedRender(){
 document.querySelectorAll(".nav-group").forEach(function(g){if(g.querySelector('.nav-item[data-view="'+state.view+'"]'))g.open=true});
 document.querySelectorAll(".nav-item[data-view]").forEach(function(b){b.classList.toggle("active",b.dataset.view===state.view)});
 document.getElementById("studentName").textContent=state.student;
 const map={dashboard:dashboard,learn:learn,safety:safety,labs:renderExpandedLabs,quiz:quiz,exam:expandedExam,reference:expandedReference,tools:expandedTools,tutor:expandedTutor,ar:expandedAR,settings:expandedSettings};
 (map[state.view]||dashboard)();updateProgress();
}
function installExpansionNav(){
 const navs=[["exam","🎓","Assessments"],["tools","🧰","Tools"],["tutor","🤖","AI Tutor"],["ar","📷","Apprentice AR"]];
 const n=document.querySelector(".nav");
 if(n&&!document.querySelector('[data-view="exam"]'))navs.forEach(function(x){const b=document.createElement("button");b.className="nav-item";b.dataset.view=x[0];b.innerHTML="<span>"+x[1]+"</span>"+x[2];b.addEventListener("click",function(){nav(x[0]);document.getElementById("sidebar").classList.remove("open")});n.appendChild(b)});
}
const originalNav=nav;
function nav(v){state.view=v;save();expandedRender()}
installExpansionNav();
render=expandedRender;
expandedRender();

/* Final renderer compatibility for bilingual module records */
function moduleRow(m){
 const done=state.completed.indexOf(m.id)>=0;
 const title=typeof m.title==="object"?(m.title[state.language==="EN"?"EN":"DE"]||m.title.DE):m.title;
 const desc=typeof m.desc==="object"?(m.desc[state.language==="EN"?"EN":"DE"]||m.desc.DE):m.desc;
 return '<div class="module"><div class="module-icon">'+m.icon+'</div><div><h4>'+title+' '+(done?'<span class="pill green">✓</span>':'')+'</h4><small>'+m.level+' · '+m.time+'<br>'+desc+'</small></div><div class="module-progress"><strong>'+(done?100:0)+'%</strong><div class="meter"><i style="width:'+(done?100:0)+'%"></i></div><button class="btn secondary" style="margin-top:7px;padding:7px 9px;font-size:10px" onclick="openModule(\''+m.id+'\')">Open</button></div></div>';
}
