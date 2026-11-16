# Presentation Kit — 3-minute pitch + 7 minutes of questions (English and Romanian)

The competition format is a **3-minute pitch followed by 7 minutes of questions**. This page gives you the pitch
in **English and Romanian**, a 40-second live-demo route, the stand route, and a bank of **18 likely questions with
answers in both languages**. Every number below comes from `client/src/data/benchmark.json`
(run `npm run benchmark` to regenerate it).

> **If someone else presents** (for example a classmate): say at the start *"This project was created by
> stefaniat2 as a solo project; I'm presenting it on their behalf."* Never say "I programmed it". Replace "I / my"
> in the scripts with "the author / their". Also make sure the
> author can be reached for very technical questions.

## 1. Rubric → where you prove it

| Criterion | Evidence | Where |
|---|---|---|
| 01 Originality | A scheduler that solves a real constrained problem with four algorithms *in the browser*, plus a budget strategy game and a watts→money→CO₂→trees calculator, in 3 languages | Pitch 0:45–1:45 |
| 02 Practicality | A family types its own appliances and tariff and gets start times; economic case study in lei and EUR with honest payback | Pitch 2:25 |
| 03 UI/UX | One burger menu, instant language switch, charts with text alternatives, keyboard and screen-reader support, Lighthouse 100 / 100 / 100 | Demo |
| 04 Functionality | Everything works live: scheduler, game, leaderboard, forms. **50 automated tests** pass | Demo + CI badge |
| 05 Technical skills | React/Vite, Express, SQLite/Turso, i18n, pure tested algorithms (annealing, genetic, branch and bound), statistics, reproducible benchmark | Pitch 1:45 + Q&A |
| 06 Oral presentation | Hook, one question, evidence, honesty, timing | Whole pitch |
| 07 Documentation | README, architecture, user guide, **abstract, visual annex, logbook, economics**, fact-check | [docs/research/](research/README.md) |
| 08 Stand | **A0 poster** with hypothesis, system, four figures, ROI, QR | [STAND.md](STAND.md) |
| 09 Responsible AI | Tools, prompts, who did what, mistakes found, honest limits | `AI_USAGE.md` §9 |

## 2. The 3-minute pitch (English)

> Speak it in your own words; short sentences; look at the jury. About 330 words ≈ 2:50. Practise with a timer.

**0:00 — Hook (20 s).** "About 655 million people still have no electricity. And in Moldova, where night
electricity is about 22% cheaper, most of us still start the washing machine at seven in the evening."

**0:20 — The question (25 s).** "My question: can a computer choose start times for a family's appliances so the
bill falls — without ever tripping the main fuse — and which algorithm does it best? I wrote four hypotheses
*before* running a single experiment."

**0:45 — The project (20 s).** "*Energize the Future* is an SDG 7 website in English, Romanian and Russian. You can
*learn*, *play* a strategy game, and *measure*: a calculator, and the **Smart Scheduler** I'll show you now."

**1:05 — Live demo (40 s).** Open **Smart Scheduler** → keep the Premier Energy tariff → **Find the cheapest
schedule**. "Same inputs, five methods, a few milliseconds. The dashed boxes are the family's habit, the green bars
the optimised schedule, and the red line is the fuse — total power never crosses it."

**1:45 — The evidence (40 s).** "I tested 393 random households with the same budget of 2,400 evaluations. Optimised
schedules save **10% with a loose fuse and 6% with a tight one**, against the habit, p below 0.001. With a tight fuse
simulated annealing ends **0.4% from the proven optimum; greedy 1.1%**. Exact search is perfect for one family — but
at 40 appliances it finishes its proof only **8%** of the time: that is where the heuristics matter. One honest
caveat: the searches start from the greedy schedule, so part of that edge is built in."

**2:25 — The money (20 s).** "For a reference family that is about **27 euros — 540 lei — a year**, free with the
timer already inside the washer. A 1,000-euro energy system would never pay back. And I claim no CO₂ saving: shifting
changes the price, not the energy."

**2:45 — AI and close (15 s).** "Claude Code wrote the code under my direction; I set the question, checked every
result, and its mistakes — an unfair baseline, infeasible schedules in the tables — are in the logbook. Everything is
open: scan the QR code and try it."

## 3. Pitch de 3 minute (română)

**0:00 — Început (20 s).** „Aproximativ 655 de milioane de oameni nu au încă electricitate. Iar în Moldova, unde
curentul de noapte este cu circa 22% mai ieftin, majoritatea dintre noi pornim în continuare mașina de spălat la
șapte seara."

**0:20 — Întrebarea (25 s).** „Întrebarea mea: poate un calculator să aleagă orele de pornire ale electrocasnicelor
unei familii astfel încât factura să scadă — fără ca siguranța principală să sară — și care algoritm o face cel mai
bine? Am scris patru ipoteze *înainte* de a rula vreun experiment."

**0:45 — Proiectul (20 s).** „*Energize the Future* este un site despre ODD 7, în engleză, română și rusă. Poți
să *înveți*, să *joci* un joc de strategie și să *măsori*: un calculator și **Planificatorul inteligent**, pe care
vi-l arăt acum."

**1:05 — Demonstrație live (40 s).** Deschide **Planificator inteligent** → păstrează tariful Premier Energy →
**Găsește programul cel mai ieftin**. „Aceleași date, cinci metode, câteva milisecunde. Casetele punctate sunt
obiceiul familiei, barele verzi programul optimizat, iar linia roșie este siguranța — puterea totală nu o depășește
niciodată."

**1:45 — Dovezile (40 s).** „Am testat 393 de gospodării aleatorii, cu același buget de 2.400 de evaluări. Programele
optimizate economisesc **10% cu siguranță largă și 6% cu siguranță strânsă**, față de obicei, p sub 0,001. Cu
siguranță strânsă, călirea simulată ajunge la **0,4% de optimul dovedit; metoda lacomă la 1,1%**. Căutarea exactă
este perfectă pentru o familie — dar la 40 de aparate își încheie demonstrația doar în **8%** din cazuri: acolo contează
metodele euristice. O precizare onestă: căutările pornesc de la programul lacom, deci o parte din avantaj este
construită în ele."

**2:25 — Banii (20 s).** „Pentru o familie de referință înseamnă circa **27 de euro — 540 de lei — pe an**, gratuit,
cu temporizatorul din mașina de spălat. Un sistem de 1.000 de euro nu s-ar amortiza niciodată. Și nu pretind nicio
economie de CO₂: mutarea consumului schimbă prețul, nu energia."

**2:45 — IA și încheiere (15 s).** „Claude Code a scris codul după indicațiile mele; eu am stabilit întrebarea și am
verificat fiecare rezultat, iar greșelile lui — o bază de comparație nedreaptă, programe neviabile în tabele — sunt în
jurnal. Totul este deschis: scanați codul QR și încercați."

## 4. Demo routes

**In the 3-minute pitch (40 s):** Smart Scheduler → *Find the cheapest schedule* → point at the table (five methods,
milliseconds) → timeline (dashed habit vs green optimised) → power chart (red fuse line).
Optional extra: set **Fuse limit** to **3.7** and press the button again — with the default appliances the saving
shrinks from about 9.6 to about 0.5 lei a day, because a tight fuse leaves almost no room to choose.

**At the stand (3 minutes):**
1. **Home** (10 s). 2. **Language** → Русский → Română → English (15 s).
3. **Mini Game** — start, first option on every level, show the consequences panel and the locked option at level 8,
   do **not** submit while rehearsing (75 s).
4. **Smart Scheduler** — default inputs, then tariff **Flat**: "no night discount, no saving" (40 s).
5. **Research page** — hypotheses with verdicts, then the scalability table (30 s).
6. **AI & Credits** (10 s).

### Pre-flight checklist (10 minutes before)

- [ ] Open `https://energize-the-future-wuln.onrender.com/api/health` to wake the free server (~50 s). The Scheduler and
      Research pages work without it; the game, facts and forms need it.
- [ ] Open the site; run the Scheduler once; switch to Romanian and back.
- [ ] Phone on hotspot: scan the QR code from the poster.
- [ ] Laptop charged; zoom 100 %; notifications off; tab with the repository README; a 60-second screen recording as backup.

## 5. Questions the jury may ask — 18 answers in English and Romanian

Answer in your own words and honestly. If you present for the author, add "…and the author documented it in X".

### Science and algorithms

**1. What is your hypothesis, and did the data support it?**
EN: Four, written before the first full run: optimised beats habit; annealing and genetic beat greedy on a tight fuse;
the saving is capped by the tariff; exact search stops scaling. All four were supported — H2 with a caveat that the
searches start from greedy.
RO: Patru, scrise înainte de prima rulare completă: optimizat bate obiceiul; călirea și algoritmul genetic bat metoda
lacomă la siguranță strânsă; economia este plafonată de tarif; căutarea exactă nu se scalează. Toate patru au fost
susținute — H2 cu mențiunea că căutările pornesc de la metoda lacomă.

**2. Why four methods and not just the best one?**
EN: To measure, not assume. Greedy is the simple baseline, annealing and genetic are two different search ideas,
and exact branch and bound gives the true optimum to measure everyone's gap.
RO: Ca să măsurăm, nu să presupunem. Metoda lacomă este reperul simplu, călirea și algoritmul genetic sunt două idei
diferite de căutare, iar ramificarea și limitarea exactă dă optimul real față de care măsurăm distanța fiecăruia.

**3. Is the comparison fair?**
EN: Same fitness, same budget of 2,400 evaluations, same households, paired tests. The one built-in advantage — the
searches start from greedy — is stated; the fair comparison is against the proven optimum, where annealing is
0.41% away in the tight regime and found it in 103 of 193 households.
RO: Aceeași funcție de cost, același buget de 2.400 de evaluări, aceleași gospodării, teste pe perechi. Singurul avantaj
încorporat — pornirea de la programul lacom — este declarat; comparația corectă este cu optimul dovedit, de care
călirea este la 0,41% în regimul strâns și pe care l-a găsit în 103 din 193 de gospodării.

**4. If exact search is perfect for a household, why use heuristics?**
EN: For one family you don't need them — that is an honest finding. They matter for larger problems: at 24 appliances
exact search proves optimality in 27% of cases, at 40 in 8%, and returns worse schedules than annealing.
RO: Pentru o familie nu e nevoie — este o concluzie onestă. Contează la probleme mai mari: la 24 de aparate căutarea
exactă își dovedește optimul în 27% din cazuri, la 40 în 8%, și dă programe mai slabe decât călirea.

**5. How do you know it isn't luck?**
EN: Everything is seeded and reproducible (`npm run benchmark`); 200 and 193 households per regime, 100 per size in the
scalability test; 95% confidence intervals; paired tests with p below 0.001 for the main claims.
RO: Totul este cu valoare inițială fixă și reproductibil (`npm run benchmark`); 200 și 193 de gospodării pe regim, 100
pe dimensiune la testul de scalare; intervale de încredere de 95%; teste pe perechi cu p sub 0,001 pentru afirmațiile
principale.

**6. How big is the search space?**
EN: 24 possible start hours per appliance, so 24⁶ ≈ 191 million combinations for six unrestricted appliances.
RO: 24 de ore posibile de pornire pe aparat, deci 24⁶ ≈ 191 de milioane de combinații pentru șase aparate fără restricții.

**7. Explain simulated annealing to a non-expert.**
EN: Imagine cooling hot metal slowly. At first the algorithm accepts even worse schedules so it doesn't get stuck; as it
"cools" it becomes strict and settles on a very good one.
RO: Gândiți-vă la răcirea lentă a metalului încins. La început algoritmul acceptă chiar și programe mai slabe ca să nu
rămână blocat; pe măsură ce se „răcește” devine strict și se oprește la unul foarte bun.

### Model and economics

**8. How realistic is the model?**
EN: It is a model: constant-power blocks, one run a day, synthetic households. It is meant to compare methods and
show the effect of a tariff — not to predict one real bill. Real meter data is the next step.
RO: Este un model: blocuri cu putere constantă, o rulare pe zi, gospodării sintetice. Servește la compararea metodelor
și la arătarea efectului unui tarif — nu la prezicerea unei facturi reale. Următorul pas sunt datele reale de la contor.

**9. Where do the tariffs come from, and are they right?**
EN: From Premier Energy's own page on differentiated prices: 3.75 lei/kWh by day and 2.94 by night, in force since 2 April 2026
(flat price 3.56). The page does not say whether VAT is included, and I did not read the ANRE decision itself. FEE Nord's
two-zone prices are a 2025 media report and may be outdated. Earlier reports gave other values, so the saving is also
shown for those scenarios (19–34 EUR a year) and the tool lets you type your own prices.
RO: De pe pagina Premier Energy despre prețurile diferențiate: 3,75 lei/kWh ziua și 2,94 noaptea, în vigoare din 2 aprilie 2026
(prețul unic 3,56). Pagina nu precizează dacă includ TVA, iar decizia ANRE nu am citit-o. Prețurile FEE Nord pe două zone
sunt dintr-un raport din 2025 și pot fi depășite. Relatări anterioare dădeau alte valori, deci economia este arătată și
pentru ele (19–34 EUR pe an), iar instrumentul permite introducerea propriilor prețuri.

**10. What is the economic benefit and what does it cost?**
EN: About 540 lei (27 EUR) a year for a reference family; 291–1,118 lei depending on the fuse and the ceiling. The tool is free;
built-in timers pay back immediately, three smart plugs in 1.7 years, a 1,000-euro system never.
RO: Circa 540 de lei (27 EUR) pe an pentru o familie de referință; 291–1.118 lei în funcție de siguranță și de plafon.
Instrumentul este gratuit; temporizatoarele din aparate se amortizează imediat, trei prize inteligente în 1,7 ani, un
sistem de 1.000 de euro niciodată.

**11. Why no school case?**
EN: A school's loads are very different and I had no meter data, so I did not invent a figure. For similar households
you multiply; for a school real load data is needed.
RO: Consumul unei școli este foarte diferit și nu am avut date de la contor, așa că nu am inventat o cifră. Pentru
gospodării similare se înmulțește; pentru o școală sunt necesare date reale.

**12. What is the CO₂ benefit?**
EN: None is claimed. Moving use in time changes the price, not the amount of energy. It can help the grid by lowering the
evening peak, but I did not measure that.
RO: Nu se pretinde niciunul. Mutarea consumului în timp schimbă prețul, nu cantitatea de energie. Poate ajuta rețeaua
prin reducerea vârfului de seară, dar nu am măsurat asta.

### Engineering, AI and ethics

**13. What did the AI do and what did you do?**
EN: Claude Code wrote the code, tests and drafts; I set the questions, hypotheses and acceptance checks, reviewed the
results, published the site and decide what is claimed. `AI_USAGE.md` §9 has the table.
RO: Claude Code a scris codul, testele și ciornele; eu am stabilit întrebările, ipotezele și criteriile de acceptare,
am verificat rezultatele, am publicat site-ul și decid ce se afirmă. `AI_USAGE.md` §9 conține tabelul.

**14. What mistakes did the AI make in this part?**
EN: An unfair baseline that broke the fuse in 19 of 20 sample households; infeasible schedules counted in the gaps; a
faulty stability test; chart captions that still described old results. Found by sanity runs, re-reading and
looking at the output; all in the logbook.
RO: O bază de comparație nedreaptă, care depășea siguranța în 19 din 20 de gospodării; programe neviabile numărate în
distanțe; un test de stabilitate greșit; descrieri de grafice care mai vorbeau despre rezultate vechi. Găsite prin
rulări de verificare, recitire și privirea rezultatului; toate sunt în jurnal.

**15. Can anyone reproduce your results?**
EN: Yes: `cd client && npm install && npm run benchmark` gives identical numbers (only the milliseconds change). The
documents and poster are generated from the same file.
RO: Da: `cd client && npm install && npm run benchmark` dă numere identice (se schimbă doar milisecundele). Documentele și
posterul sunt generate din același fișier.

**16. Who is on the team?**
EN: A solo project by Stefania Tabarcea (stefaniat2). The MoldSEF regulation allows individual projects (teams have at most 2 members), and the mentor, Azamat Jauysh, and the teacher agreed.
RO: Proiect individual al Ștefaniei Tabarcea (stefaniat2). Regulamentul MoldSEF permite proiecte individuale (echipele au cel mult 2 membri), iar mentorul, Azamat Jauysh, și profesorul sunt de acord.

**17. Is it secure and private?**
EN: Server-side validation, parameterised SQL, rate limiting, CORS allow-list, no accounts, cookies or tracking. The
scheduler runs entirely in your browser — your appliances never leave your device.
RO: Validare pe server, SQL parametrizat, limitarea cererilor, listă de origini permise, fără conturi, cookie-uri sau
urmărire. Planificatorul rulează complet în browser — aparatele tale nu părăsesc dispozitivul.

**18. What would you do next?**
EN: Validate on real smart-meter data from a household or the school, add solar panels and a battery to the model,
and have the Romanian and Russian texts proofread by native speakers.
RO: Validarea pe date reale de la contoare inteligente dintr-o gospodărie sau din școală, adăugarea panourilor solare și a
bateriei în model, și corectarea textelor în română și rusă de către vorbitori nativi.

## 6. Delivery tips

- Open with the number and the question, not "Hello, my project is…".
- One idea per sentence; pause after numbers. Spend about a third of the three minutes on the live demo.
- Time yourself: 3:00 means 2:40 in rehearsal. Rehearse the **hand-over** if two people speak.
- If something fails, say "that's the free server waking up" and switch to the backup recording. The Scheduler needs no server.
- When you do not know: "I don't have that measured. Here is what I did measure…" — then give the closest true number.
