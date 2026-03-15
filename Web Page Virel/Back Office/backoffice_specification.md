
# Архитектурная спецификация: Back Office 
## 1. Оглавление

1.  [Оглавление](#1-оглавление)
2.  [Архитектура модулей](#2-архитектура-модулей)
3.  [Модель данных](#3-модель-данных)
4.  [State Machines](#4-state-machines)
5.  [API спецификация](#5-api-спецификация)
6.  [Метрики и формулы](#6-метрики-и-формулы)
7.  [Нефункциональные требования](#7-нефункциональные-требования)
8.  [MVP и Phase 2](#8-mvp-и-phase-2)
9.  [Acceptance criteria чеклист релиза](#9-acceptance-criteria-чеклист-релиза)

---

## 2. Архитектура модулей

### 2.1. Lead Management

| Категория | Описание |
| :--- | :--- |
| **Выручка** | Прямо влияет на 100% выручки. Модуль — точка входа для всех потенциальных заказов. |
| **Маржа** | Влияет на маржу через скорость и качество обработки лидов. Оптимизация Response Time повышает конверсию в бронирование, напрямую влияя на Gross Margin. |
| **Риски** | **Потеря лида:** Технический сбой, неотвеченный запрос. **Медленная обработка:** Потеря клиента из-за долгого ответа (>5 мин). **Неэффективная маршрутизация:** Лид уходит не тому менеджеру. |
| **KPI** | `Lead Conversion Rate`, `Average Lead Response Time`, `Lead Source ROI`. |
| **Что если отключить?** | Остановка бизнеса. 100% потеря выручки. Невозможность принимать и обрабатывать новые заказы. |

### 2.2. Booking Management

| Категория | Описание |
| :--- | :--- |
| **Выручка** | Управляет ~95% подтвержденной выручки (за вычетом отмен). Основной инструмент для фиксации и выполнения заказов. |
| **Маржа** | Влияет на маржу через `Cancellation Rate` и `Model Utilization Rate`. Эффективное управление снижает количество отмен и простоев моделей. |
| **Риски** | **Двойное бронирование:** Конфликт расписания, потеря клиента и репутации. **Ошибка в деталях:** Неверное время, место, услуга. **Потеря бронирования:** Технический сбой. |
| **KPI** | `Booking Success Rate`, `Cancellation Rate`, `Average Booking Value`. |
| **Что если отключить?** | Коллапс операционной деятельности. Невозможность управлять расписанием, подтверждать заказы и отслеживать их выполнение. Потеря >90% выручки. |

### 2.3. Payment & Finance

| Категория | Описание |
| :--- | :--- |
| **Выручка** | Обрабатывает 100% денежного потока. Отвечает за сбор платежей, расчеты с моделями и учет комиссий. |
| **Маржа** | Прямо влияет на Net Margin через управление комиссиями платежных систем и снижение `Chargeback Rate`. |
| **Риски** | **Ошибка платежа:** Потеря выручки. **Chargeback:** Потеря выручки + штрафы от PSP. **Ошибка в расчетах:** Неверные выплаты моделям, кассовый разрыв. **Фрод:** Прямые финансовые потери. |
| **KPI** | `Payment Success Rate`, `Chargeback Rate`, `Payout Accuracy`. |
| **Что если отключить?** | Финансовый паралич. Невозможность принимать оплату и проводить расчеты. Риск блокировки счетов со стороны PSP. 100% остановка денежного потока. |

### 2.4. Model Control System

| Категория | Описание |
| :--- | :--- |
| **Выручка** | Косвенно влияет на выручку через качество и полноту профилей моделей, что повышает конверсию. `DataCompletenessScore` напрямую коррелирует с `Model Booking Rate`. |
| **Маржа** | Влияет на маржу через `ModelRiskIndex`. Модели с высоким риском (Red) требуют ручного подтверждения, что увеличивает операционные расходы и снижает маржу. |
| **Риски** | **Неактуальные данные:** Неверные цены, услуги, доступность. **Низкое качество профиля:** Снижение конверсии. **Проблемы с дисциплиной:** Репутационные и финансовые потери. |
| **KPI** | `DataCompletenessScore`, `ModelRiskIndex Distribution`, `Profile Update Frequency`. |
| **Что если отключить?** | Потеря контроля над основным активом. Невозможность управлять профилями, ценами, доступностью. Резкое падение качества сервиса и выручки. |

### 2.5. One Click Onboarding

| Категория | Описание |
| :--- | :--- |
| **Выручка** | Влияет на скорость привлечения новых моделей, что напрямую сказывается на росте ассортимента и, следовательно, выручки. Быстрый онбординг = больше моделей в системе. |
| **Маржа** | Снижает операционные расходы на ручную обработку анкет и фотографий. Автоматизация сокращает время менеджера на одну модель с часов до минут. |
| **Риски** | **Низкое качество данных:** Ошибки AI парсинга ведут к неверным профилям. **Задержки в обработке:** Асинхронная очередь может "зависнуть". **Дубликаты:** Создание дублирующих профилей. |
| **KPI** | `Average Onboarding Time`, `Onboarding Success Rate`, `AI Confidence Score`. |
| **Что если отключить?** | Резкое замедление роста. Процесс станет ручным, дорогим и медленным. Потеря конкурентного преимущества в привлечении лучших моделей. |

### 2.6. Reviews & Reputation

| Категория | Описание |
| :--- | :--- |
| **Выручка** | Напрямую влияет на конверсию. Высокий рейтинг и верифицированные отзывы повышают доверие и `Booking Conversion Rate`. |
| **Маржа** | Снижает отток клиентов (`Client Churn Rate`) за счет прозрачности и управления качеством. |
| **Риски** | **Фейковые отзывы:** Подрыв доверия к платформе. **Негатив без ответа:** Ухудшение репутации. **Спам-атаки:** Снижение рейтинга. |
| **KPI** | `Average Model Rating`, `Review Moderation Time`, `Verified Review Ratio`. |
| **Что если отключить?** | Потеря социального доказательства. Снижение доверия клиентов, падение конверсии и выручки. Невозможность контролировать качество услуг. |

### 2.7. Revenue Leakage Control

| Категория | Описание |
| :--- | :--- |
| **Выручка** | Защищает до 5-10% выручки, которая может быть потеряна из-за операционных ошибок, отмен и неэффективности. |
| **Маржа** | Напрямую повышает Net Margin, идентифицируя и устраняя источники потерь. |
| **Риски** | **Скрытые потери:** Незамеченные утечки выручки на всех этапах (лид, бронь, оплата). **Отсутствие ответственности:** Невозможность определить причину и виновного. |
| **KPI** | `Lost Revenue Amount`, `Leakage Incidents per Week`, `Leakage Resolution Time`. |
| **Что если отключить?** | Систематическая и неконтролируемая потеря маржи. Бизнес будет "кровоточить" деньгами без понимания причин. |

### 2.8. SLA Monitoring

| Категория | Описание |
| :--- | :--- |
| **Выручка** | Косвенно влияет на выручку через повышение `Lead Conversion Rate`. Быстрый ответ = больше бронирований. |
| **Маржа** | Снижает операционные расходы за счет автоматизации контроля и эскалации. Повышает дисциплину персонала. |
| **Риски** | **Нарушение SLA:** Потеря клиентов из-за медлительности. **Отсутствие контроля:** Менеджеры могут игнорировать лиды без последствий. |
| **KPI** | `SLA Breach Rate`, `Average First Response Time`, `Escalation Rate`. |
| **Что если отключить?** | Потеря контроля над качеством клиентского сервиса. Резкое падение скорости ответа и, как следствие, конверсии и выручки. |

### 2.9. Fraud Detection

| Категория | Описание |
| :--- | :--- |
| **Выручка** | Защищает 100% выручки от фродовых транзакций и атак. |
| **Маржа** | Напрямую защищает маржу от потерь из-за `Chargeback Rate` и штрафов от PSP. Стоимость одного чарджбэка может достигать $50-$100. |
| **Риски** | **Финансовые потери:** Прямые убытки от мошеннических платежей. **Блокировка мерчанта:** Потеря возможности принимать платежи из-за высокого уровня фрода. |
| **KPI** | `Chargeback Rate`, `Fraudulent Transaction Rate`, `Manual Review Rate`. |
| **Что если отключить?** | Гарантированные финансовые потери. Быстрый рост `Chargeback Rate` до уровней (>1%), которые приведут к блокировке платежных шлюзов и остановке бизнеса. |

### 2.10. Incident Management

| Категория | Описание |
| :--- | :--- |
| **Выручка** | Защищает репутацию и LTV клиента, управляя решением конфликтных ситуаций. |
| **Маржа** | Снижает потери от компенсаций и возвратов, формализуя процесс разбора инцидентов. |
| **Риски** | **Репутационный ущерб:** Неразрешенный конфликт ведет к негативным отзывам и потере клиентов. **Юридические риски:** Неправильная обработка инцидента. |
| **KPI** | `Incident Resolution Time`, `Incidents per 100 Bookings`, `Compensation Amount`. |
| **Что если отключить?** | Хаос в решении проблем. Репутационные потери, отток клиентов и моделей, возможные юридические последствия. |

### 2.11. Dynamic Pricing Engine

| Категория | Описание |
| :--- | :--- |
| **Выручка** | Потенциальный рост выручки на 10-20% за счет адаптивного ценообразования в зависимости от спроса, времени и других факторов. |
| **Маржа** | Увеличивает маржу, повышая цены в периоды высокого спроса и оптимизируя загрузку моделей в периоды низкого спроса. |
| **Риски** | **Неверная калибровка:** Слишком высокие цены отпугнут клиентов, слишком низкие — снизят маржу. **Сложность:** Непрозрачные правила ценообразования могут вызвать недовольство моделей и клиентов. |
| **KPI** | `Revenue Uplift`, `Average Booking Value`, `Model Utilization Rate`. |
| **Что если отключить?** | Упущенная выгода. Ценообразование останется статичным, не адаптируясь к рыночным условиям. Потеря потенциальной выручки и маржи. |

### 2.12. SEO & Content Control

| Категория | Описание |
| :--- | :--- |
| **Выручка** | Напрямую влияет на органический трафик, который является самым дешевым каналом привлечения. Рост позиций в SERP = рост выручки. |
| **Маржа** | Снижает `Customer Acquisition Cost` (CAC) за счет увеличения доли органического трафика. |
| **Риски** | **Санкции поисковых систем:** Неправильная оптимизация может привести к падению трафика. **Технические ошибки:** Проблемы с индексацией, скоростью, дублями. |
| **KPI** | `Organic Traffic Volume`, `SERP Top-10 Positions`, `LCP/TTFB/CLS`. |
| **Что если отключить?** | Потеря органического трафика. Полная зависимость от платных каналов, резкий рост CAC, снижение маржинальности. |

### 2.13. Owner Analytics

| Категория | Описание |
| :--- | :--- |
| **Выручка** | Не влияет напрямую, но предоставляет данные для принятия стратегических решений, которые ведут к росту выручки. |
| **Маржа** | Позволяет находить точки роста маржинальности через анализ юнит-экономики, конверсий и операционных метрик. |
| **Риски** | **"Слепое" управление:** Принятие решений без данных. **Неверная интерпретация:** Ошибочные выводы на основе некорректных данных. |
| **KPI** | `Revenue`, `NetMargin`, `Conversion Rate`, `ARPU`, `MRR`. |
| **Что если отключить?** | Владелец не сможет принимать обоснованные решения. Управление бизнесом превратится в гадание. Невозможность оценить эффективность и здоровье бизнеса. |

### 2.14. Unit Economics

| Категория | Описание |
| :--- | :--- |
| **Выручка** | Позволяет масштабировать прибыльные юниты (город, источник, модель) и отключать убыточные, что ведет к росту общей выручки. |
| **Маржа** | Основной инструмент для анализа и повышения маржинальности на уровне каждой транзакции. |
| **Риски** | **Масштабирование убытков:** Привлечение трафика из каналов с отрицательной юнит-экономикой. **Непонимание рентабельности:** Невозможность оценить прибыльность отдельных направлений. |
| **KPI** | `Profit per Booking`, `LTV/CAC Ratio`, `Payback Period`. |
| **Что если отключить?** | Невозможность понять, какие части бизнеса приносят деньги, а какие — убытки. Риск работы в минус при росте оборота. |

### 2.15. Audit Trail

| Категория | Описание |
| :--- | :--- |
| **Выручка** | Защищает выручку, предотвращая несанкционированные изменения цен, статусов заказов и других критичных данных. |
| **Маржа** | Снижает операционные риски и потери от внутренних злоупотреблений. |
| **Риски** | **Внутренний фрод:** Манипуляции с данными со стороны сотрудников. **Отсутствие доказательств:** Невозможность расследовать инциденты и ошибки. |
| **KPI** | `Unauthorized Actions Blocked`, `Audit Log Size`, `Reason Code Coverage`. |
| **Что если отключить?** | Потеря контроля и подотчетности. Невозможность отследить, кто, что и когда изменил в системе. Высокий риск внутреннего фрода. |

### 2.16. System Health Monitor

| Категория | Описание |
| :--- | :--- |
| **Выручка** | Защищает 100% выручки, обеспечивая стабильность и доступность платформы. Простой системы = прямая потеря выручки. |
| **Маржа** | Снижает потери от простоев и деградации производительности. |
| **Риски** | **Простой сервиса:** Недоступность сайта для клиентов. **Деградация производительности:** Медленная работа сайта ведет к потере клиентов. **Потеря данных:** Сбои в базах данных или очередях. |
| **KPI** | `Uptime`, `API Latency`, `5xx Error Rate`, `Queue Length`. |
| **Что если отключить?** | Невозможность проактивно реагировать на проблемы. Система будет падать неожиданно, что приведет к прямым финансовым и репутационным потерям. |

### 2.17. Data Governance Layer

| Категория | Описание |
| :--- | :--- |
| **Выручка** | Косвенно влияет на выручку через повышение качества данных в профилях моделей (`DataCompletenessScore`), что улучшает конверсию. |
| **Маржа** | Снижает операционные расходы на исправление ошибок в данных и ручную проверку. |
| **Риски** | **Неконсистентные данные:** Ошибки в отчетах и аналитике. **Низкое качество данных:** Снижение эффективности SEO и маркетинга. **GDPR/Compliance риски:** Неправильное управление данными. |
| **KPI** | `DataCompletenessScore`, `Outdated Profile Flag Rate`, `Data Quality Error Rate`. |
| **Что если отключить?** | "Мусор" в данных. Невозможность доверять отчетам, падение качества профилей, снижение эффективности всех остальных модулей. |

### 2.18. Integrations Hub

| Категория | Описание |
| :--- | :--- |
| **Выручка** | Обеспечивает работу ключевых каналов коммуникации (Telegram, WhatsApp) и платежей, без которых выручка невозможна. |
| **Маржа** | Снижает операционные расходы за счет автоматизации уведомлений и платежей. |
| **Риски** | **Сбой интеграции:** Потеря лидов, платежей, уведомлений. **Нестабильность API:** Зависимость от внешних сервисов. |
| **KPI** | `API Uptime`, `Integration Error Rate`, `Webhook Success Rate`. |
| **Что если отключить?** | Изоляция системы. Невозможность общаться с клиентами, принимать платежи, взаимодействовать с внешним миром. Остановка бизнеса. |

### 2.19. Reporting & Exports

| Категория | Описание |
| :--- | :--- |
| **Выручка** | Не влияет напрямую, но предоставляет данные для финансового и налогового учета, что является обязательным для легальной работы. |
| **Маржа** | Позволяет анализировать операционные расходы и находить пути для их оптимизации. |
| **Риски** | **Ошибки в отчетах:** Неверные данные для налоговой, штрафы. **Невозможность выгрузки:** Проблемы с предоставлением данных по запросу. |
| **KPI** | `Report Generation Time`, `Data Accuracy in Exports`. |
| **Что если отключить?** | Невозможность вести финансовую отчетность. Проблемы с налоговыми органами, отсутствие данных для анализа. |

### 2.20. Access & Security (RBAC)

| Категория | Описание |
| :--- | :--- |
| **Выручка** | Защищает от несанкционированного доступа к данным и функциям, которые могут повлиять на выручку (например, изменение цен). |
| **Маржа** | Снижает риск внутреннего фрода и ошибок персонала, которые ведут к финансовым потерям. |
| **Риски** | **Утечка данных:** Доступ к конфиденциальной информации. **Внутренний фрод:** Злоупотребления со стороны сотрудников. **Несанкционированные действия:** Изменение критичных данных. |
| **KPI** | `Access Denied Rate`, `Privileged Session Count`, `2FA Adoption Rate`. |
| **Что если отключить?** | Все сотрудники имеют доступ ко всему. Огромный риск утечек, фрода и операционных ошибок. Несоответствие базовым стандартам безопасности. |

### 2.21. Membership & Subscription Engine

| Категория | Описание |
| :--- | :--- |
| **Выручка** | Создает новый, предсказуемый источник регулярной выручки (MRR). Повышает `Lifetime Value` (LTV) клиентов. |
| **Маржа** | Увеличивает общую маржинальность за счет повышения LTV и удержания клиентов. Скидки для членов клуба должны быть рассчитаны так, чтобы не повредить марже. |
| **Риски** | **Абьюз скидок:** Клиенты злоупотребляют программой лояльности. **Отток подписчиков (Churn):** Высокий процент отписок снижает эффективность модуля. **Сложность в расчетах:** Неверный расчет влияния на маржу. |
| **KPI** | `MRR (Monthly Recurring Revenue)`, `LTV (Lifetime Value)`, `Churn Rate`, `ARPU (Average Revenue Per User)`. |
| **Что если отключить?** | Потеря возможности создать базу лояльных, постоянных клиентов. Бизнес остается полностью транзакционным, без предсказуемого дохода. |

---

---

## 3. Модель данных

*Все сущности включают стандартные поля: `id` (PK, UUID), `created_at` (timestamp), `updated_at` (timestamp), `deleted_at` (timestamp, soft delete).* 
, soft delete, nullable). Поля, помеченные `*`, обязательны для заполнения.*

### 3.1. Core Entities

**`Client`**
- `id`
- `first_name` (string, опционально)
- `last_name` (string, опционально)
- `phone_number` (string, уникальный)
- `email` (string, уникальный, опционально)
- `risk_status`* (enum: `normal`, `monitoring`, `restricted`, `blocked`) - см. Fraud Detection
- `total_spent` (decimal)
- `booking_count` (integer)
- `chargeback_count` (integer)
- `notes` (text)
- `client_membership_id` (FK -> ClientMembership)

**`ModelProfile`**
- `id`
- `public_name`* (string)
- `status`* (enum: `draft`, `review`, `published`, `hidden`, `archived`) - см. State Machine
- `real_name` (string, зашифровано)
- `phone_number` (string, зашифровано)
- `data_completeness_score` (integer, 0-100)
- `model_risk_index` (enum: `green`, `yellow`, `red`)
- `onboarding_job_id` (FK -> OnboardingJob)

**`Booking`**
- `id`
- `short_id`* (string, human-readable, e.g. `BK-12345`)
- `client_id`* (FK -> Client)
- `model_id`* (FK -> ModelProfile)
- `receptionist_id` (FK -> User)
- `status`* (enum: `pending_confirmation`, `confirmed`, `in_progress`, `completed`, `cancelled`, `disputed`) - см. State Machine
- `start_time`* (timestamp)
- `end_time`* (timestamp)
- `duration_hours`* (integer)
- `service_details` (text)
- `location_address` (text)
- `total_amount`* (decimal)
- `commission_amount`* (decimal)
- `payout_amount`* (decimal)
- `cancellation_reason` (string)
- `cancellation_fee` (decimal)

**`Payment`**
- `id`
- `booking_id`* (FK -> Booking)
- `amount`* (decimal)
- `currency`* (string, e.g. `GBP`)
- `status`* (enum: `pending`, `succeeded`, `failed`, `refunded`, `disputed`) - см. State Machine
- `provider`* (string, e.g. `Stripe`)
- `provider_transaction_id` (string)
- `payment_method_details` (jsonb)
- `failure_reason` (string)

**`Lead`**
- `id`
- `source`* (string, e.g. `WhatsApp`, `Telegram`, `Phone`)
- `client_phone`* (string)
- `client_name` (string)
- `message_history` (jsonb)
- `status`* (enum: `new`, `in_progress`, `converted`, `rejected`, `spam`) - см. State Machine
- `receptionist_id` (FK -> User)
- `first_response_at` (timestamp)
- `last_activity_at` (timestamp)

### 3.2. Onboarding & Content

**`OnboardingJob`**
- `id`
- `status`* (enum: `created`, `queued`, `processing`, `needs_review`, `approved`, `published`, `failed`)
- `source_files_path` (string)
- `error_message` (text)
- `ai_confidence_score` (decimal, 0-1)

**`MediaAsset`**
- `id`
- `model_profile_id`* (FK -> ModelProfile)
- `asset_type`* (enum: `photo`, `video`)
- `s3_url`* (string)
- `status`* (enum: `uploaded`, `processing`, `ready`, `rejected`)
- `quality_score` (integer)
- `is_primary` (boolean)

**`AIExtractionResult`**
- `id`
- `onboarding_job_id`* (FK -> OnboardingJob)
- `field_name`* (string, e.g. `age`, `height`)
- `extracted_value`* (string)
- `confidence_score`* (decimal, 0-1)

### 3.3. Reputation & Incidents

**`Review`**
- `id`
- `booking_id`* (FK -> Booking, unique)
- `client_id`* (FK -> Client)
- `model_id`* (FK -> ModelProfile)
- `rating`* (integer, 1-5)
- `text` (text)
- `status`* (enum: `pending`, `approved`, `rejected`, `flagged`, `escalated`)
- `is_verified_booking`* (boolean)
- `sentiment_score` (decimal, -1 to 1)
- `toxicity_flag` (boolean)
- `suspicious_flag` (boolean)
- `reply_by_model` (text)
- `reply_by_manager` (text)

**`Incident`**
- `id`
- `booking_id` (FK -> Booking)
- `reporter_id`* (FK -> User or Client)
- `accused_id`* (FK -> User or ModelProfile)
- `status`* (enum: `reported`, `investigating`, `resolved`, `closed`)
- `description`* (text)
- `resolution_details` (text)
- `compensation_amount` (decimal)

### 3.4. Finance & Control

**`LostRevenueRegistry`**
- `id`
- `type`* (enum: `missed_booking`, `unpaid_cancellation`, `receptionist_error`...)
- `amount`* (decimal)
- `booking_id` (FK -> Booking)
- `lead_id` (FK -> Lead)
- `root_cause`* (string)
- `responsible_role`* (enum: `client`, `model`, `receptionist`, `system`)
- `status`* (enum: `open`, `resolved`)

**`FraudSignal`**
- `id`
- `client_id`* (FK -> Client)
- `booking_id` (FK -> Booking)
- `signal_type`* (enum: `high_velocity`, `chargeback`, `ip_mismatch`...)
- `risk_score_impact` (integer)
- `metadata` (jsonb)

**`AuditEvent`**
- `id`
- `entity_type`* (string, e.g. `Booking`, `Payment`)
- `entity_id`* (UUID)
- `action`* (enum: `create`, `update`, `delete`)
- `before_state` (jsonb)
- `after_state` (jsonb)
- `actor_id`* (FK -> User)
- `actor_role`* (string)
- `reason_code` (string)
- `ip_address` (string)
- `user_agent` (string)

### 3.5. SEO

**`SEOPage`**
- `id`
- `page_type`* (enum: `model_profile`, `geo_page`, `blog_post`)
- `path`* (string, unique)
- `title`* (string)
- `meta_description`* (string)
- `index_status`* (enum: `indexed`, `not_indexed`, `blocked`)
- `canonical_url` (string)
- `schema_markup` (jsonb)
- `last_crawled_at` (timestamp)

### 3.6. Membership

**`MembershipPlan`**
- `id`
- `name`* (string)
- `tier`* (integer)
- `price_monthly`* (decimal)
- `currency`* (string)
- `booking_discount_percent`* (integer)
- `priority_support_level`* (integer)
- `status`* (enum: `active`, `archived`)

**`ClientMembership`**
- `id`
- `client_id`* (FK -> Client, unique)
- `plan_id`* (FK -> MembershipPlan)
- `status`* (enum: `pending`, `active`, `past_due`, `suspended`, `cancelled`, `expired`)
- `started_at`* (timestamp)
- `expires_at` (timestamp)
- `auto_renew`* (boolean)
- `next_billing_at` (timestamp)

**`SubscriptionInvoice`**
- `id`
- `client_membership_id`* (FK -> ClientMembership)
- `amount`* (decimal)
- `status`* (enum: `draft`, `paid`, `failed`, `void`)
- `period_start`* (date)
- `period_end`* (date)

### 3.7. System & Users

**`User`**
- `id`
- `email`* (string, unique)
- `password_hash`* (string)
- `role`* (enum: `owner`, `manager`, `receptionist`, `accountant`)
- `is_active`* (boolean)
- `last_login_at` (timestamp)
- `two_factor_secret` (string)

**`SystemSetting`**
- `key`* (string, unique)
- `value`* (jsonb)
- `description` (text)
- `is_editable_by_ui` (boolean)


---

## 4. State Machines

### 4.1. Lead

| Статус | Описание | Переходы | Триггер / Логика |
| :--- | :--- | :--- | :--- |
| `new` | Новый лид, получен из любого канала. | `in_progress` | Менеджер взял лид в работу (назначил себя). |
| `in_progress` | Лид в обработке у менеджера. | `converted`, `rejected`, `spam` | `converted`: Создано бронирование. `rejected`: Клиент отказался или не подходит. `spam`: Лид помечен как спам. |
| `converted` | Лид успешно конвертирован в бронирование. | - | Финальный статус. |
| `rejected` | Лид отклонен. | - | Финальный статус. Требуется указание причины. |
| `spam` | Лид помечен как спам. | - | Финальный статус. |

### 4.2. Booking

| Статус | Описание | Переходы | Триггер / Логика |
| :--- | :--- | :--- | :--- |
| `pending_confirmation` | Новое бронирование, ожидает подтверждения. | `confirmed`, `cancelled` | `confirmed`: Менеджер подтвердил доступность и детали. `cancelled`: Отмена до подтверждения. |
| `confirmed` | Бронирование подтверждено, ожидается оплата/начало. | `in_progress`, `cancelled` | `in_progress`: Наступило время начала бронирования. `cancelled`: Отмена после подтверждения (может взиматься штраф). |
| `in_progress` | Бронирование в процессе выполнения. | `completed`, `disputed` | `completed`: Время бронирования истекло, услуга оказана. `disputed`: Возник инцидент во время выполнения. |
| `completed` | Бронирование успешно завершено. | - | Финальный статус. Запускает процесс выплаты модели. |
| `cancelled` | Бронирование отменено. | - | Финальный статус. Требуется `cancellation_reason`. |
| `disputed` | Возник спор/инцидент. | `completed`, `cancelled` | Статус меняется после разбора инцидента в модуле Incident Management. |

### 4.3. Payment

| Статус | Описание | Переходы | Триггер / Логика |
| :--- | :--- | :--- | :--- |
| `pending` | Платеж инициирован, ожидается ответ от PSP. | `succeeded`, `failed` | Webhook от платежного провайдера. |
| `succeeded` | Платеж успешно проведен. | `refunded` | `refunded`: Полный или частичный возврат средств. |
| `failed` | Платеж не прошел. | - | Финальный статус. Сохраняется причина отказа. |
| `refunded` | Средства возвращены клиенту. | - | Финальный статус. |
| `disputed` | Клиент оспорил платеж (chargeback). | - | Финальный статус. Запускает алерт и процесс разбора. |

### 4.4. ModelProfile

| Статус | Описание | Переходы | Триггер / Логика |
| :--- | :--- | :--- | :--- |
| `draft` | Профиль создан, заполняется. Не виден на сайте. | `review` | Менеджер отправляет профиль на проверку после заполнения. |
| `review` | Профиль на проверке у старшего менеджера/owner. | `published`, `draft` | `published`: Профиль одобрен. `draft`: Профиль возвращен на доработку. |
| `published` | Профиль активен и виден на сайте. | `hidden`, `archived` | `hidden`: Временно скрыть профиль. `archived`: Профиль убран в архив. |
| `hidden` | Профиль временно скрыт с сайта. | `published`, `archived` | `published`: Вернуть профиль на сайт. `archived`: Архивировать. |
| `archived` | Модель больше не работает с агентством. | - | Финальный статус. |

### 4.5. Review

| Статус | Описание | Переходы | Триггер / Логика |
| :--- | :--- | :--- | :--- |
| `pending` | Новый отзыв, ожидает модерации. | `approved`, `rejected`, `flagged` | Модератор проверяет отзыв. |
| `approved` | Отзыв одобрен и опубликован. | `escalated` | `escalated`: Отзыв оспорен моделью или менеджером. |
| `rejected` | Отзыв отклонен (спам, нарушение правил). | - | Финальный статус. |
| `flagged` | Отзыв помечен как подозрительный (автоматически). | `approved`, `rejected`, `escalated` | Требует ручной проверки модератором. |
| `escalated` | Отзыв требует разбирательства на более высоком уровне. | `approved`, `rejected` | Решение принимает старший менеджер/owner. |

### 4.6. Membership

| Статус | Описание | Переходы | Триггер / Логика |
| :--- | :--- | :--- | :--- |
| `pending` | Ожидание первого платежа после регистрации. | `active`, `cancelled` | `active`: Успешный платеж. `cancelled`: Отмена до оплаты. |
| `active` | Подписка активна. | `past_due`, `cancelled` | `past_due`: Неудачная попытка очередного списания. `cancelled`: Клиент отменил подписку. |
| `past_due` | Просрочен платеж. Доступ ограничен. | `active`, `suspended` | `active`: Успешное списание в grace period. `suspended`: Неудача после нескольких попыток. |
| `suspended` | Подписка заморожена из-за неоплаты или фрода. | `active`, `cancelled` | `active`: Ручная реактивация после решения проблемы. `cancelled`: Окончательная отмена. |
| `cancelled` | Подписка отменена клиентом или системой. | - | Финальный статус. |
| `expired` | Срок действия подписки истек (без автопродления). | - | Финальный статус. |

### 4.7. Incident

| Статус | Описание | Переходы | Триггер / Логика |
| :--- | :--- | :--- | :--- |
| `reported` | Новый инцидент зарегистрирован в системе. | `investigating` | Менеджер взял инцидент в работу. |
| `investigating` | Идет сбор информации и расследование. | `resolved`, `closed` | `resolved`: Найден способ решения. `closed`: Решение не требуется или невозможно. |
| `resolved` | Принято решение по инциденту (например, компенсация). | `closed` | Все действия по решению выполнены. |
| `closed` | Инцидент закрыт. | - | Финальный статус. |

### 4.8. OnboardingJob

| Статус | Описание | Переходы | Триггер / Логика |
| :--- | :--- | :--- | :--- |
| `created` | Задача создана, файлы загружены. | `queued` | Система подтвердила получение файлов и поставила задачу в очередь. |
| `queued` | Задача в очереди на обработку. | `processing` | Worker взял задачу из очереди. |
| `processing` | Идет AI-парсинг данных и обработка медиа. | `needs_review`, `failed` | `needs_review`: Обработка завершена. `failed`: Произошла критическая ошибка. |
| `needs_review` | Требуется ручная проверка и подтверждение менеджером. | `approved` | Менеджер проверил и одобрил результат. |
| `approved` | Результат одобрен, готов к публикации. | `published` | Профиль модели опубликован на сайте. |
| `published` | Профиль опубликован. | - | Финальный статус. |
| `failed` | Обработка не удалась. | - | Финальный статус. Требует ручного разбора. |

### 4.9. MediaAsset

| Статус | Описание | Переходы | Триггер / Логика |
| :--- | :--- | :--- | :--- |
| `uploaded` | Файл загружен на сервер. | `processing` | Задача на обработку (конвертация, скоринг) создана. |
| `processing` | Идет обработка файла. | `ready`, `rejected` | `ready`: Обработка успешна. `rejected`: Файл не прошел проверку (качество, формат). |
| `ready` | Файл готов к использованию. | `rejected` | `rejected`: Менеджер отклонил файл вручную. |
| `rejected` | Файл отклонен. | - | Финальный статус. |


---

## 5. API спецификация

*Все эндпоинты возвращают стандартную структуру ответа: `{ "data": { ... } }` в случае успеха (2xx) и `{ "error": { "code": "...", "message": "..." } }` в случае ошибки (4xx, 5xx). Все эндпоинты, изменяющие состояние (POST, PUT, PATCH, DELETE), должны быть идемпотентными, где это применимо, с использованием заголовка `Idempotency-Key`.*

### 5.1. Auth API Group (`/api/v1/auth`)

| # | Method & Path | Auth | Описание и Payload |
| :--- | :--- | :--- | :--- |
| 1 | `POST /login` | None | **Аутентификация пользователя.**<br>**Payload:** `{ email, password }`.<br>**Returns:** `{ accessToken, refreshToken }`. |
| 2 | `POST /refresh` | None | **Обновление токена.**<br>**Payload:** `{ refreshToken }`.<br>**Returns:** `{ accessToken }`. |
| 3 | `POST /logout` | User | **Выход из системы.**<br>Инвалидирует refresh token. |
| 4 | `POST /request-2fa` | User | **Запрос на включение 2FA.**<br>**Returns:** `{ qrCodeUrl, secret }`. |
| 5 | `POST /confirm-2fa` | User | **Подтверждение 2FA.**<br>**Payload:** `{ code }`. |

### 5.2. Users API Group (`/api/v1/users`)

| # | Method & Path | Auth | Описание и Payload |
| :--- | :--- | :--- | :--- |
| 1 | `GET /` | Owner | **Получение списка пользователей.**<br>Поддерживает пагинацию, фильтрацию по `role`, `is_active`. |
| 2 | `POST /` | Owner | **Создание нового пользователя.**<br>**Payload:** `{ email, role, password }`. |
| 3 | `GET /:id` | Owner | **Получение пользователя по ID.** |
| 4 | `PATCH /:id` | Owner | **Обновление пользователя.**<br>**Payload:** `{ role, is_active }`. |
| 5 | `GET /me` | User | **Получение данных о текущем пользователе.** |

### 5.3. Leads API Group (`/api/v1/leads`)

| # | Method & Path | Auth | Описание и Payload |
| :--- | :--- | :--- | :--- |
| 1 | `GET /` | Receptionist+ | **Получение списка лидов.**<br>Фильтры: `status`, `receptionist_id`, `source`. Сортировка. Пагинация. |
| 2 | `POST /` | System | **Создание нового лида (внутреннее).**<br>Вызывается интеграционным хабом (Telegram/WhatsApp бот). |
| 3 | `GET /:id` | Receptionist+ | **Получение лида по ID.** |
| 4 | `PATCH /:id/assign` | Receptionist+ | **Назначение менеджера на лид.**<br>**Payload:** `{ receptionist_id }`. |
| 5 | `PATCH /:id/status` | Receptionist+ | **Изменение статуса лида.**<br>**Payload:** `{ status, reason? }`. `reason` обязателен для `rejected`, `spam`. |

### 5.4. Bookings API Group (`/api/v1/bookings`)

| # | Method & Path | Auth | Описание и Payload |
| :--- | :--- | :--- | :--- |
| 1 | `GET /` | Receptionist+ | **Получение списка бронирований.**<br>Фильтры: `status`, `model_id`, `client_id`, `date_range`. |
| 2 | `POST /` | Receptionist+ | **Создание нового бронирования.**<br>**Payload:** `{ client_id, model_id, start_time, end_time, ... }`. |
| 3 | `GET /:id` | Receptionist+ | **Получение бронирования по ID.** |
| 4 | `PATCH /:id/status` | Receptionist+ | **Изменение статуса бронирования.**<br>**Payload:** `{ status, reason_code, notes? }`. `reason_code` обязателен для `cancelled`, `disputed`. |
| 5 | `GET /calendar` | Receptionist+ | **Получение бронирований в формате календаря.**<br>Query params: `view_type` (month/week/day), `model_id`. |

### 5.5. Payments API Group (`/api/v1/payments`)

| # | Method & Path | Auth | Описание и Payload |
| :--- | :--- | :--- | :--- |
| 1 | `GET /` | Accountant+ | **Получение списка платежей.**<br>Фильтры: `status`, `booking_id`, `date_range`. |
| 2 | `POST /:booking_id/charge` | Receptionist+ | **Создание платежа для бронирования.**<br>**Payload:** `{ amount, payment_method_id }`. |
| 3 | `POST /webhooks/:provider` | None | **Webhook от платежного провайдера.**<br>Обрабатывает статусы `succeeded`, `failed`. |
| 4 | `POST /:id/refund` | Manager+ | **Создание возврата.**<br>**Payload:** `{ amount, reason_code }`. |

### 5.6. Models API Group (`/api/v1/models`)

| # | Method & Path | Auth | Описание и Payload |
| :--- | :--- | :--- | :--- |
| 1 | `GET /` | Receptionist+ | **Получение списка профилей моделей.**<br>Фильтры: `status`, `risk_index`. |
| 2 | `GET /:id` | Receptionist+ | **Получение полного профиля модели.** |
| 3 | `PATCH /:id` | Manager+ | **Обновление данных профиля.**<br>**Payload:** `{ public_name, real_name, ... }`. Все изменения логируются в Audit Trail. |
| 4 | `PATCH /:id/status` | Manager+ | **Изменение статуса профиля.**<br>**Payload:** `{ status, reason_code }`. |
| 5 | `GET /:id/history` | Manager+ | **Получение истории изменений профиля.** |

### 5.7. Onboarding API Group (`/api/v1/onboarding`)

| # | Method & Path | Auth | Описание и Payload |
| :--- | :--- | :--- | :--- |
| 1 | `POST /jobs` | Manager+ | **Создание задачи на онбординг.**<br>Загрузка zip-архива с фото и анкетой. multipart/form-data. |
| 2 | `GET /jobs` | Manager+ | **Получение списка задач на онбординг.**<br>Фильтры: `status`. |
| 3 | `GET /jobs/:id` | Manager+ | **Получение деталей задачи и результата парсинга.** |
| 4 | `POST /jobs/:id/approve` | Manager+ | **Одобрение результата и создание профиля модели.**<br>**Payload:** `{ reason_code }`. |

### 5.8. Media API Group (`/api/v1/media`)

| # | Method & Path | Auth | Описание и Payload |
| :--- | :--- | :--- | :--- |
| 1 | `POST /upload-url` | Manager+ | **Получение presigned URL для загрузки медиафайла.**<br>**Payload:** `{ model_profile_id, file_name, content_type }`. |
| 2 | `PATCH /assets/:id/status` | Manager+ | **Изменение статуса медиафайла.**<br>**Payload:** `{ status, reason_code }`. |

### 5.9. Reviews API Group (`/api/v1/reviews`)

| # | Method & Path | Auth | Описание и Payload |
| :--- | :--- | :--- | :--- |
| 1 | `GET /` | Manager+ | **Получение списка отзывов для модерации.**<br>Фильтры: `status`, `model_id`. |
| 2 | `PATCH /:id/status` | Manager+ | **Модерация отзыва.**<br>**Payload:** `{ status, reason_code }`. |
| 3 | `POST /:id/reply` | Manager+ | **Добавление ответа на отзыв.**<br>**Payload:** `{ text, author_role }`. |

### 5.10. Fraud API Group (`/api/v1/fraud`)

| # | Method & Path | Auth | Описание и Payload |
| :--- | :--- | :--- | :--- |
| 1 | `GET /clients/:id/status` | Receptionist+ | **Получение риск-статуса клиента.** |
| 2 | `PATCH /clients/:id/status` | Manager+ | **Ручное изменение риск-статуса клиента.**<br>**Payload:** `{ risk_status, reason_code, notes }`. |
| 3 | `GET /signals` | Manager+ | **Получение списка фрод-сигналов.**<br>Фильтры: `client_id`, `signal_type`. |

### 5.11. Incidents API Group (`/api/v1/incidents`)

| # | Method & Path | Auth | Описание и Payload |
| :--- | :--- | :--- | :--- |
| 1 | `GET /` | Manager+ | **Получение списка инцидентов.**<br>Фильтры: `status`, `reporter_id`. |
| 2 | `POST /` | Receptionist+ | **Создание нового инцидента.**<br>**Payload:** `{ booking_id, description, ... }`. |
| 3 | `PATCH /:id/status` | Manager+ | **Обновление статуса инцидента.**<br>**Payload:** `{ status, resolution_details, compensation_amount?, reason_code }`. |

### 5.12. SEO API Group (`/api/v1/seo`)

| # | Method & Path | Auth | Описание и Payload |
| :--- | :--- | :--- | :--- |
| 1 | `GET /pages` | Manager+ | **Получение списка SEO-страниц.**<br>Фильтры: `page_type`, `index_status`. |
| 2 | `PATCH /pages/:id` | Manager+ | **Обновление мета-данных страницы.**<br>**Payload:** `{ title, meta_description, schema_markup }`. |
| 3 | `GET /health` | Manager+ | **Получение отчета о здоровье SEO.** |

### 5.13. Reports API Group (`/api/v1/reports`)

| # | Method & Path | Auth | Описание и Payload |
| :--- | :--- | :--- | :--- |
| 1 | `POST /generate` | Manager+ | **Генерация отчета.**<br>**Payload:** `{ report_type, date_range, filters }`.<br>**Returns:** `{ job_id }`. Отчет генерируется асинхронно. |
| 2 | `GET /jobs/:id/status` | Manager+ | **Проверка статуса генерации отчета.** |
| 3 | `GET /jobs/:id/download` | Manager+ | **Скачивание готового отчета.** |

### 5.14. Audit API Group (`/api/v1/audit`)

| # | Method & Path | Auth | Описание и Payload |
| :--- | :--- | :--- | :--- |
| 1 | `GET /events` | Owner | **Получение лога аудита.**<br>Фильтры: `entity_type`, `entity_id`, `actor_id`, `date_range`. |

### 5.15. System API Group (`/api/v1/system`)

| # | Method & Path | Auth | Описание и Payload |
| :--- | :--- | :--- | :--- |
| 1 | `GET /health` | None | **Проверка здоровья сервиса (uptime).** |
| 2 | `GET /metrics` | Owner | **Получение метрик производительности системы (Prometheus-совместимый формат).** |
| 3 | `GET /settings` | Owner | **Получение системных настроек.** |
| 4 | `PATCH /settings` | Owner | **Обновление системных настроек.**<br>**Payload:** `{ key, value }`. |

### 5.16. Membership API Group (`/api/v1/membership`)

| # | Method & Path | Auth | Описание и Payload |
| :--- | :--- | :--- | :--- |
| 1 | `GET /plans` | Receptionist+ | **Получение списка планов подписки.** |
| 2 | `GET /clients/:id/subscription` | Receptionist+ | **Получение данных о подписке клиента.** |
| 3 | `POST /clients/:id/subscription` | Receptionist+ | **Оформление подписки для клиента.**<br>**Payload:** `{ plan_id, payment_method_id }`. |
| 4 | `DELETE /clients/:id/subscription` | Manager+ | **Отмена подписки.**<br>**Payload:** `{ reason_code }`. |
| 5 | `GET /invoices` | Accountant+ | **Получение счетов на оплату подписок.** |

---

## 6. Метрики и формулы

| # | Метрика | Формула | Источник данных | Период | Диапазон | Влияние на маржу |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Revenue** | `SUM(Payment.amount) WHERE status = 'succeeded'` | `Payment` | Месяц | > 0 | Прямое |
| 2 | **Net Margin** | `(Revenue - SUM(Booking.payout_amount) - SUM(Payment.provider_fee)) / Revenue` | `Payment`, `Booking` | Месяц | 10-25% | Определяющее |
| 3 | **Commission** | `SUM(Booking.commission_amount) WHERE status = 'completed'` | `Booking` | Месяц | > 0 | Прямое |
| 4 | **Payout** | `SUM(Booking.payout_amount) WHERE status = 'completed'` | `Booking` | Месяц | > 0 | Прямое (расход) |
| 5 | **Lead Conversion Rate** | `(COUNT(Lead) WHERE status = 'converted') / COUNT(Lead) * 100%` | `Lead` | Неделя | 15-30% | Косвенное |
| 6 | **Avg Lead Response Time** | `AVG(Lead.first_response_at - Lead.created_at)` | `Lead` | День | < 5 мин | Косвенное |
| 7 | **SLA Breach Rate** | `(COUNT(ReceptionSLA) WHERE breached = true) / COUNT(ReceptionSLA) * 100%` | `ReceptionSLA` | День | < 2% | Косвенное |
| 8 | **Cancellation Rate** | `(COUNT(Booking) WHERE status = 'cancelled') / COUNT(Booking) * 100%` | `Booking` | Месяц | < 10% | Отрицательное |
| 9 | **Chargeback Rate** | `(COUNT(Payment) WHERE status = 'disputed') / COUNT(Payment) WHERE status = 'succeeded' * 100%` | `Payment` | Месяц | < 0.5% | Сильно отрицательное |
| 10 | **Fraud Cases** | `COUNT(FraudSignal) WHERE risk_score_impact > 50` | `FraudSignal` | Неделя | < 5 | Отрицательное |
| 11 | **Average Model Rating** | `AVG(Review.rating) WHERE status = 'approved'` | `Review` | Месяц | 4.5 - 5.0 | Косвенное |
| 12 | **ModelRiskIndex Distribution** | `COUNT(ModelProfile) GROUP BY model_risk_index` | `ModelProfile` | Неделя | Green > 80% | Косвенное |
| 13 | **Lead Source ROI** | `(SUM(Booking.commission_amount) FROM LeadSource) / Cost(LeadSource)` | `Booking`, `Lead`, Marketing Data | Квартал | > 1 | Прямое |
| 14 | **Booking Velocity** | `COUNT(Booking) WHERE status = 'confirmed'` | `Booking` | День | Зависит от сезона | Индикатор спроса |
| 15 | **Average Onboarding Time** | `AVG(OnboardingJob.published_at - OnboardingJob.created_at)` | `OnboardingJob` | Месяц | < 24 часов | Косвенное (расходы) |
| 16 | **API 5xx Error Rate** | `(COUNT(requests WHERE status_code >= 500)) / COUNT(all_requests) * 100%` | API Gateway Logs | Час | < 0.1% | Индикатор стабильности |
| 17 | **MRR** | `SUM(MembershipPlan.price_monthly) FROM active ClientMembership` | `ClientMembership`, `MembershipPlan` | День | > 0 | Прямое |
| 18 | **Churn Rate** | `(COUNT(cancelled_memberships_in_period) / COUNT(active_memberships_at_start)) * 100%` | `ClientMembership` | Месяц | < 5% | Отрицательное |
| 19 | **ARPU** | `(Revenue + MRR) / COUNT(unique_clients)` | `Payment`, `ClientMembership`, `Client` | Месяц | > 0 | Индикатор ценности |
| 20 | **LTV/CAC Ratio** | `(ARPU * (1/Churn Rate)) / CAC` | `ARPU`, `Churn Rate`, Marketing Data | Квартал | > 3 | Ключевой показатель |
| 21 | **DataCompletenessScore** | `AVG(ModelProfile.data_completeness_score)` | `ModelProfile` | Неделя | > 95% | Косвенное |


---

## 7. Нефункциональные требования

### 7.1. Производительность

| Метрика | Целевое значение (SLO) | Комментарий |
| :--- | :--- | :--- |
| **TTFB (Time to First Byte)** | < 400 мс | Для всех страниц, генерируемых сервером. |
| **LCP (Largest Contentful Paint)** | < 2.5 с | Для всех публичных страниц (профили, главная). |
| **Поиск по моделям (API)** | < 300 мс (p95) | Время ответа API на поисковый запрос. |
| **Фильтры в каталоге (API)** | < 1 с (p95) | Применение любого набора фильтров. |
| **Асинхронные операции** | - | Все операции длительностью >500 мс (обработка медиа, генерация отчетов, AI-парсинг) должны выполняться в фоновом режиме без блокировки UI. |

### 7.2. Надежность и Устойчивость

| Требование | Описание |
| :--- | :--- |
| **Доступность (Uptime)** | 99.9% для публичного сайта и API. |
| **Резервное копирование** | Ежедневное автоматическое резервное копирование базы данных. Настроен Point-in-Time Recovery (PITR) с окном в 7 дней. |
| **Механизм Retry** | Все фоновые задачи (jobs) должны иметь механизм повторного выполнения с экспоненциальной задержкой (exponential backoff) в случае сбоев. |
| **Dead-Letter Queue (DLQ)** | Задачи, провалившиеся после всех попыток retry, помещаются в DLQ для ручного анализа. Настроены алерты на пополнение DLQ. |
| **Отказоустойчивость платежей** | Наличие основного и резервного платежного провайдера. Автоматическое переключение в случае недоступности основного. |

### 7.3. Безопасность

| Требование | Описание |
| :--- | :--- |
| **Контроль доступа (RBAC)** | Строгое разделение ролей: Owner, Manager, Receptionist, Accountant. Доступ к функциям и данным ограничен на основе роли. |
| **Аутентификация** | Обязательное использование 2FA (TOTP) для всех ролей, кроме Receptionist. Политика сложности паролей. |
| **Защита данных** | Шифрование чувствительных данных в базе данных (PII моделей, финансовые данные) at-rest. Использование TLS 1.3 для всех коммуникаций (in-transit). |
| **Аудит** | Все критичные действия (изменение статуса, цены, данных) записываются в неизменяемый (append-only) лог аудита (`AuditEvent`). Обязательное поле `reason_code` для ручных вмешательств. |
| **Защита от угроз** | Применение мер для защиты от OWASP Top 10, включая SQL-инъекции, XSS, CSRF. Использование `HttpOnly`, `Secure` флагов для cookies. |
| **Управление сессиями** | Автоматический выход из системы после периода неактивности (30 минут). Контроль одновременных сессий. |
| **IP Allowlisting** | Возможность ограничения доступа к back office по списку IP-адресов. |

### 7.4. Масштабируемость

| Требование | Описание |
| :--- | :--- |
| **Горизонтальное масштабирование** | Приложение должно быть stateless, чтобы позволить запуск нескольких экземпляров за балансировщиком нагрузки. Состояние (сессии, кэш) вынесено во внешнее хранилище (Redis). |
| **База данных** | Использование управляемого сервиса баз данных (например, AWS RDS for PostgreSQL), который поддерживает масштабирование по CPU/RAM/Storage. |
| **Асинхронная обработка** | Использование очередей сообщений (Redis Streams или RabbitMQ) для распределения нагрузки от тяжелых операций на выделенные worker-процессы. |

---

## 8. MVP и Phase 2

План разделен на 2 этапа: создание минимально жизнеспособного продукта (MVP) для запуска основной функциональности и закрытия критических рисков (8-12 недель), и последующее развитие (Phase 2).

### 8.1. MVP (8-12 недель)

**Цель:** Запустить стабильную и контролируемую операционную платформу, устранить критические SEO-проблемы и обеспечить базовую безопасность и учет.

| Модуль | Объем работ в MVP |
| :--- | :--- |
| **Lead & Booking Management** | Полная функциональность: создание, управление, смена статусов. Календарь. |
| **Payment & Finance** | Интеграция с одним PSP (Stripe). Прием платежей, базовый учет комиссий и выплат. Ручные возвраты. |
| **Model Control System** | Создание и редактирование профилей, управление статусами, загрузка фото. Без `ModelRiskIndex`. |
| **Access & Security (RBAC)** | Полная реализация: роли, 2FA, логин, управление пользователями. |
| **Audit Trail** | Полная реализация. Логирование всех критичных операций. |
| **Integrations Hub** | Интеграция с Telegram/WhatsApp для приема лидов (через API-провайдеров). Интеграция с PSP. |
| **SEO & Content Control** | **Критически важно:** Исправление LCP, TTFB. Внедрение канонических тегов, генерация sitemap.xml, robots.txt, базовой Schema.org разметки. ЧПУ для профилей. |
| **System Health Monitor** | Базовый мониторинг: Uptime, API Error Rate, API Latency. Алерты в Telegram/Slack. |
| **Reviews & Reputation** | Базовая модерация: `pending`, `approved`, `rejected`. Без автоматического скоринга. |

**Архитектура MVP:** Монолитное приложение (Python/Django или Node.js/NestJS), база данных PostgreSQL, Redis для кэша и очередей. Развертывание на одном виртуальном сервере (DigitalOcean/Hetzner) или в PaaS (Heroku/Render).

### 8.2. Phase 2 (после MVP)

**Цель:** Автоматизация, рост выручки, повышение маржинальности и аналитика.

| Модуль | Объем работ в Phase 2 |
| :--- | :--- |
| **One Click Onboarding** | Полная автоматизация: AI-парсинг, скоринг качества медиа, дедупликация. |
| **Revenue Leakage Control** | Внедрение `LostRevenueRegistry` и автоматических правил детекции утечек. |
| **SLA Monitoring** | Автоматический трекинг времени ответа и эскалации при нарушениях. |
| **Fraud Detection** | Внедрение `FraudSignal`, `ClientRiskStatus` и автоматических правил блокировки. |
| **Incident Management** | Формализация процесса через сущность `Incident` и state machine. |
| **Dynamic Pricing Engine** | Разработка и внедрение правил динамического ценообразования. |
| **Owner Analytics & Unit Economics** | Разработка дашбордов с 20+ метриками, отчеты по юнит-экономике. |
| **Membership & Subscription Engine** | Полная реализация: планы, подписки, MRR, биллинг, анти-абьюз. |
| **Reporting & Exports** | Конструктор отчетов с асинхронной генерацией. |
| **Data Governance Layer** | Внедрение `DataCompletenessScore` и автоматических проверок. |

### 8.3. Риски

| Риск | План митигации |
| :--- | :--- |
| **Зависимость от внешних API** | Выбор надежных провайдеров (Stripe, Twilio). Реализация retry-логики и мониторинга доступности API. |
| **Разрастание скоупа (Scope Creep)** | Строгое следование плану MVP. Все новые требования проходят через оценку влияния на сроки и бюджет и откладываются на Phase 2. |
| **Миграция данных** | **Недостаточно данных.** Если существует старая система, потребуется отдельный план миграции. **Вариант 1:** Ручной перенос данных для MVP. **Вариант 2:** Написание скриптов для автоматической миграции. **Риск:** Потеря или повреждение данных. |

---

## 9. Acceptance criteria чеклист релиза

Чеклист для приемки MVP перед запуском в production.

### 9.1. Функциональные критерии

- [ ] **Лиды:** Лид из Telegram/WhatsApp появляется в back office в статусе `new` в течение 1 минуты.
- [ ] **Бронирования:** Менеджер может создать бронирование, привязав клиента и модель, и провести его по всем статусам до `completed`.
- [ ] **Платежи:** Клиент может успешно оплатить бронирование через интегрированный PSP. Платеж корректно отображается в системе.
- [ ] **Профили:** Менеджер может создать, отредактировать и опубликовать профиль модели. Опубликованный профиль корректно отображается на фронтенде.
- [ ] **Безопасность:** Пользователь с ролью `Receptionist` не может получить доступ к настройкам пользователей (раздел Users). Вход для `Owner` без 2FA невозможен.
- [ ] **Аудит:** Изменение цены в профиле модели создает запись в `AuditEvent` с `reason_code`.

### 9.2. Нефункциональные критерии

- [ ] **Производительность:** LCP главной страницы и страницы профиля < 2.5с по данным PageSpeed Insights.
- [ ] **SEO:** На всех страницах профилей присутствуют корректные, уникальные `title` и `meta description`, а также `canonical` URL.
- [ ] **SEO:** Файл `sitemap.xml` генерируется автоматически и содержит все опубликованные профили и страницы.
- [ ] **Надежность:** Система успешно восстанавливается после перезапуска сервера. Фоновые задачи (если есть в MVP) не теряются.
- [ ] **Мониторинг:** Тестовый алерт о 5xx ошибке успешно доставляется в канал для уведомлений.
- [ ] **Резервное копирование:** Настроено и успешно выполнено хотя бы одно полное резервное копирование базы данных.
