# UXPRESSO — MEGA MGC COFFEE Kiosk Design System

Version: 2.0  
Status: Proposed / Pre-validation  
Platform: Self-service Kiosk  
Design Approach: Brand-driven, Intent-driven, Inclusive Design  
Reference: HeyAlpha AI Kiosk Design System v1.1  
Product Reference: UXPRESSO Kiosk PRD v3.0

> Familiar Brand, Accessible Experience.
> 누구나 쉽게, 혼자서도 자신 있게.

---

## 0. System Intent

This design system is built for an inclusive,  
brand-driven, multimodal coffee ordering experience.

The interface responds to customer intent through  
existing, reusable and validated UI components.

Voice interaction assists menu discovery,  
product selection, customization and cart addition.

Final order review, benefits, rewards and payment  
remain under direct customer control.

### System Objectives

- Preserve MEGA MGC COFFEE brand familiarity.
- Reduce digital interaction barriers.
- Support independent and accurate ordering.
- Maintain business and promotional visibility.
- Enable seamless touch and voice interaction.
- Provide visual feedback for every voice interaction.
- Reuse existing UI rather than generating arbitrary screens.

### Interaction Philosophy

Voice Input.  
Visual Output.  
Customer Control.

### System Boundary

This is an unofficial redesign proposal.

Brand tokens, hardware specifications, product data,  
payment policies and accessibility requirements  
must be validated before production deployment.

---

## 1. Core Principles

### 1.1 Familiar Brand, Accessible Experience

Maintain the familiar MEGA MGC COFFEE identity  
while improving usability and accessibility.

Preserve:

- Brand yellow and black
- Existing product photography
- Familiar menu terminology
- Existing major menu categories
- Partner logos
- Promotional visibility

Improve:

- Visual hierarchy
- Information architecture
- Touch interaction
- Voice interaction
- Error prevention
- Error recovery

### 1.2 Intent-driven UI

The interface responds to customer intent.

Customer:  
"메뉴 추천해 줘."

System:  
Navigate to the existing recommendation category.

Do not create a separate AI chat interface  
when an existing UI can satisfy the intent.

### 1.3 Accessible by Default

Accessibility is part of the default interface,  
not an isolated alternative experience.

- Readable text
- Clear hierarchy
- Large touch targets
- Visual guidance
- Optional voice assistance
- Sufficient interaction time

### 1.4 Reduce Decisions, Not Features

Reduce decision complexity without unnecessarily  
removing existing functions or product categories.

### 1.5 Reduce Complexity, Not Visibility

Preserve discoverability of:

- New products
- Collaboration products
- Promotions
- Membership benefits
- Payment brands
- Rewards

Use visual grouping rather than hiding  
important choices behind additional navigation.

### 1.6 One Flow, Multiple Ways

Touch and voice share:

- Navigation state
- Product selection
- Product configuration
- Cart
- Order session

Changing input method must not reset the order.

### 1.7 Instant Feedback

Every interaction must provide visible feedback.

Examples:

- Selected category
- Selected product
- Selected option
- Updated quantity
- Updated price
- Voice listening
- Voice processing
- Cart addition
- Error and recovery

### 1.8 Progressive Disclosure

Show relevant information at the appropriate stage.

Use for:

- Optional product configuration
- Detailed product information
- Contextual help
- Voice guidance
- Error recovery

Do not use progressive disclosure to unnecessarily  
hide menu categories or supported payment brands.

### 1.9 Confidence Over Speed

Do not prioritize ordering speed over  
customer understanding and order accuracy.

Customers must have sufficient time to decide.

### 1.10 Speak to Select, Touch to Confirm

Voice supports menu selection and cart addition.

Final order review, benefits, rewards and payment  
require direct customer interaction.

---

## 2. Visual Foundations

### 2.1 Brand Identity

Brand Personality:

- Familiar
- Friendly
- Energetic
- Approachable
- Clear
- Trustworthy

Visual Direction:

Bold brand expression with calm functional UI.

Use yellow for brand identity and primary actions.

Use white and neutral surfaces for information.

Use black for strong hierarchy and voice controls.

Avoid excessive decorative colors.

### 2.2 Brand Color Tokens

| Token | Value | Usage |
|---|---|---|
| brand.yellow | #FFDC00 | Primary brand color |
| brand.black | #171717 | Brand contrast |
| brand.white | #FFFFFF | Main background |
| brand.yellow.soft | #FFF7D1 | Voice guidance surface |

These are proposed redesign tokens,  
not verified official brand specifications.

### 2.3 Neutral Color Tokens

| Token | Value | Usage |
|---|---|---|
| neutral.0 | #FFFFFF | Main surface |
| neutral.50 | #F5F5F5 | Secondary surface |
| neutral.100 | #E8E8E8 | Disabled surface |
| neutral.200 | #D9D9D9 | Decorative border |
| neutral.400 | #8A8A8A | Non-text boundary |
| neutral.600 | #595959 | Secondary text |
| neutral.900 | #171717 | Primary text |

### 2.4 Semantic Color Tokens

| Token | Value | Usage |
|---|---|---|
| success.default | #237A45 | Success |
| success.surface | #EDF7EF | Success background |
| error.default | #C62828 | Error |
| error.surface | #FFF1F1 | Error background |
| warning.default | #946200 | Warning |
| warning.surface | #FFF4D6 | Warning background |
| info.default | #2459A6 | Information |
| info.surface | #EDF4FF | Information background |

### 2.5 Semantic Alias Tokens

```text
color.background.default = neutral.0
color.background.secondary = neutral.50
color.text.primary = neutral.900
color.text.secondary = neutral.600
color.border.default = neutral.200
color.border.interactive = neutral.400

color.action.primary.background = brand.yellow
color.action.primary.text = brand.black

color.action.secondary.background = brand.white
color.action.secondary.text = brand.black
color.action.secondary.border = brand.black

color.action.voice.background = brand.black
color.action.voice.text = brand.white

color.selection.background = brand.yellow
color.selection.text = brand.black
color.selection.border = brand.black

color.voice.surface = brand.yellow.soft
color.voice.text = brand.black
```

### 2.6 Color Usage Rules

- Yellow indicates brand identity and primary actions.
- Selected elements use color, border and text weight.
- Red is reserved for errors and destructive warnings.
- Green is reserved for confirmed success.
- Normal session timers use neutral colors.
- Voice listening is not represented by color alone.
- White text on yellow is not used for essential information.
- Decorative borders are not sufficient for control boundaries.
- Validate contrast for all text and interactive states.

### 2.7 Typography

Primary Font:

Pretendard

Fallback:

Noto Sans KR, sans-serif

| Token | Size | Weight | Line Height |
|---|---:|---:|---:|
| type.display | 56px | 700 | 72px |
| type.heading.1 | 40px | 700 | 56px |
| type.heading.2 | 32px | 700 | 44px |
| type.heading.3 | 28px | 600 | 40px |
| type.body.large | 28px | 400 | 40px |
| type.body.default | 24px | 400 | 36px |
| type.body.small | 22px | 400 | 32px |
| type.label | 24px | 600 | 32px |
| type.caption | 20px | 400 | 28px |
| type.micro | 18px | 400 | 26px |
| type.price | 32px | 700 | 40px |
| type.total | 40px | 700 | 52px |
| type.button | 28px | 700 | 40px |

### Typography Rules

- Product names must remain readable at kiosk distance.
- Essential instructions use body.default or larger.
- Micro text is limited to non-essential information.
- Prices use consistent number formatting.
- Avoid unnecessary English-only instructions.
- Avoid excessive line truncation.
- Important product information must not be hidden.
- Use natural Korean line breaks.

### 2.8 Spacing

Base Unit: 4px

```text
space.1 = 4px
space.2 = 8px
space.3 = 12px
space.4 = 16px
space.5 = 20px
space.6 = 24px
space.8 = 32px
space.10 = 40px
space.12 = 48px
space.16 = 64px
space.20 = 80px
```

Usage:

- Icon and label gap: 8-12px
- Related information gap: 12-16px
- Component padding: 16-24px
- Card gap: 16-24px
- Section gap: 32-48px
- Screen margin: 40px

### 2.9 Radius

```text
radius.none = 0px
radius.sm = 8px
radius.md = 12px
radius.lg = 16px
radius.xl = 24px
radius.modal = 32px
radius.full = 999px
```

Rules:

- Product cards: radius.lg
- Buttons: radius.md
- Category tabs: radius.md
- Voice guidance: radius.lg
- Modal: radius.modal
- Badges: radius.sm or radius.full

### 2.10 Borders

```text
border.default = 1px
border.interactive = 2px
border.selected = 3px
border.focus = 4px
```

Selected states must remain distinguishable  
without relying only on background color.

### 2.11 Elevation

elevation.0:  
No shadow.

elevation.1:  
0px 2px 8px rgba(0,0,0,0.06)

elevation.2:  
0px 4px 16px rgba(0,0,0,0.10)

elevation.3:  
0px 12px 32px rgba(0,0,0,0.16)

Use shadows primarily for:

- Sticky regions
- Overlays
- Modals

Avoid unnecessary decorative elevation.

### 2.12 Iconography

Style:

- Rounded outline
- Consistent stroke
- Familiar symbols
- Text label for important actions

```text
icon.sm = 24px
icon.md = 32px
icon.lg = 40px
icon.xl = 48px
icon.feature = 64px
```

Core Icons:

- Home
- Microphone
- Microphone off
- Audio wave
- Volume
- Volume off
- Shopping cart
- Coffee
- Takeout cup
- Plus
- Minus
- Check
- Close
- Back
- Globe
- Accessibility
- Clock
- Card
- Gift
- Coupon
- Help
- Warning

Payment logos use verified brand assets,  
not generic replacement icons.

### 2.13 Motion

```text
motion.fast = 120ms
motion.default = 200ms
motion.slow = 300ms
```

Rules:

- Provide immediate interaction feedback.
- Avoid unnecessary page transitions.
- Do not delay ordering for animation.
- Avoid flashing voice indicators.
- Support reduced motion.
- Do not communicate status through animation alone.

---

## 3. Interaction Primitives

### 3.1 Primary Button

Purpose:

The main action in the current context.

Examples:

- 매장에서 먹기
- 포장하기
- 장바구니에 담기
- 주문 확인
- 계속 주문하기

Properties:

- label
- leading_icon
- trailing_icon
- size
- state
- action

Variants:

- Default
- Pressed
- Focused
- Loading
- Disabled

Visual:

- Background: brand.yellow
- Text: brand.black
- Radius: radius.md
- Font: type.button

### 3.2 Secondary Button

Purpose:

Alternative or supporting actions.

Examples:

- 메뉴 더 담기
- 수정하기
- 다시 말하기
- 시간 연장

Visual:

- Background: white
- Border: brand.black
- Text: brand.black

### 3.3 Tertiary Button

Purpose:

Low-emphasis utility actions.

Examples:

- 상세 정보
- 이전 화면
- 도움말

Important utility actions must still  
have sufficient touch area.

### 3.4 Destructive Button

Purpose:

Actions that remove or reset order data.

Examples:

- 상품 삭제
- 주문 종료

Rules:

- Clearly communicate consequences.
- Require confirmation for full cart deletion.
- Do not use red for ordinary cancellation.

### 3.5 AI Trigger Button

Component:

Voice/Trigger

Purpose:

Activate voice assistance during menu ordering.

Placement:

- Start screen
- Sticky global header
- Menu exploration
- Product configuration

Default Label:

"음성으로 주문하기"

States:

- Idle
- Listening
- Processing
- Active
- Error
- Unavailable
- Ended

Default Visual:

- Background: brand.black
- Text: brand.white
- Microphone icon

Listening Visual:

- Background: brand.yellow
- Text: brand.black
- Audio wave icon
- Visible listening label

Rules:

- Do not activate microphone automatically.
- Show active microphone state.
- Provide a clear stop action.
- Preserve existing order state.
- Remove the trigger from final review and payment.
- Validate physical reach on the actual kiosk.

### 3.6 Dynamic Action Button

Component:

Button/Dynamic

States:

- Default
- Loading
- Disabled
- Success
- Error

The label must reflect the current action.

Examples:

- 장바구니에 담기
- 담는 중
- 장바구니에 담았어요

Prevent duplicate actions during processing.

### 3.7 Category Tab

Component:

Navigation/CategoryTab

States:

- Default
- Selected
- Pressed
- Focused

Selected:

- Yellow background
- Black border
- Bold label
- Optional selected indicator

### 3.8 Filter Chip

Component:

Navigation/FilterChip

Variants:

- Default
- Selected
- Disabled

Examples:

- 전체
- HOT
- ICE
- 시즌 메뉴
- 콜라보 메뉴

### 3.9 Quantity Stepper

Component:

Input/QuantityStepper

Elements:

- Decrease
- Current quantity
- Increase

Rules:

- Large independent touch targets.
- Prevent invalid quantities.
- Update price immediately.
- Do not remove an item unexpectedly.

### 3.10 Selection Control

Component:

Input/SelectionCard

Variants:

- Single selection
- Multiple selection
- Required
- Optional
- Disabled

Examples:

- HOT / ICE
- 우유 변경
- 샷 추가
- 당도 조절

### 3.11 Badge

Component:

Feedback/Badge

Variants:

- NEW
- BEST
- 추천
- 할인
- 시즌
- 콜라보
- 품절

Rules:

- Use only verified product attributes.
- Avoid excessive badge density.
- Sold-out status must remain clearly visible.
- BEST requires a valid popularity source.

---

## 4. Adaptive Components

### 4.1 Product Card

Component:

Product/Card

Based on HeyAlpha Food Intelligence Card.

Properties:

- id
- name
- image
- price
- description
- temperature
- tags
- availability
- category_ids

Anatomy:

1. Product image
2. Product badge
3. Product name
4. Temperature information
5. Price
6. Optional short description
7. Detail action

Variants:

- Default
- Selected
- Recommended
- New
- Promotion
- Sold out
- Voice matched

Rules:

- Use actual product photography.
- Maintain consistent image ratio.
- Product name and price are always visible.
- Sold-out products cannot be added.
- Voice-matched products use existing cards.
- Do not create an unrelated AI visual style.

### 4.2 AI Suggestion Card

Component:

Product/SuggestionCard

Based on HeyAlpha AI Suggestion Card.

Use only when a contextual recommendation  
requires additional explanation.

Properties:

- product_id
- title
- context_tag
- price
- recommendation_reason
- availability
- action

Examples:

- 달콤한 음료
- 디카페인 메뉴
- 3,000원 이하
- 차가운 음료

Rules:

- Reuse Product/Card as the base.
- Add only relevant recommendation context.
- Do not generate unverified product information.
- Generic recommendation requests navigate
  to the existing recommendation category.

### 4.3 Product Grid

Component:

Product/Grid

Proposed Layout:

- Three columns
- 24px gap
- Consistent card height
- Consistent image ratio

States:

- Default
- Loading
- Empty
- Filtered
- Error

Validate three-column density against  
the existing four-column layout.

### 4.4 Product Detail

Component:

Product/Detail

Elements:

- Product image
- Product name
- Description
- Verified product information
- Price
- Close
- Product selection CTA

Rules:

- Preserve previous navigation position.
- Do not generate unsupported ingredient claims.
- Product details must be available without voice.

### 4.5 Product Configuration

Component:

Product/Configuration

Sections:

- Product summary
- Required options
- Optional options
- Quantity
- Current price
- Add to cart

Rules:

- Separate required and optional choices.
- Show additional option prices.
- Update total immediately.
- Ask only for missing required information.

### 4.6 Voice Guidance Bar

Component:

Voice/GuidanceBar

Placement:

Below global header and above relevant content.

Properties:

- voice_state
- transcript
- response
- instruction
- audio_enabled
- retry_available
- dismiss_available

Anatomy:

1. Voice status icon
2. Current status label
3. Recognized speech
4. AI response
5. Next action instruction
6. Audio control
7. Close or stop control

Visual:

- Background: brand.yellow.soft
- Text: brand.black
- Radius: radius.lg

Rules:

- Conditional visibility.
- No permanent chat history.
- No full-screen chatbot by default.
- All audio guidance is also displayed as text.
- Keep the existing product UI accessible.
- Long messages must not obscure essential controls.

### 4.7 Voice Confirmation

Component:

Voice/Confirmation

Elements:

- Recognized product
- Temperature
- Quantity
- Options
- Price
- Confirm
- Edit

Rules:

- Use existing Product/Configuration
  and Product/Summary components.  
- Never confirm an ambiguous product automatically.
- Allow confirmation through explicit voice
  or direct touch before adding to cart.

### 4.8 Voice Error

Component:

Voice/Error

Default Copy:

"잘 듣지 못했어요."

"다시 말하거나 화면에서 선택해 주세요."

Actions:

- 다시 말하기
- 화면에서 선택하기

Rules:

- Preserve cart.
- Preserve current screen.
- Do not blame the customer.
- Provide a touch fallback.

### 4.9 Cart Item

Component:

Cart/Item

Properties:

- cart_item_id
- product_id
- product_name
- temperature
- quantity
- options
- unit_price
- total_price

Actions:

- Edit
- Increase
- Decrease
- Remove

### 4.10 Sticky Cart

Component:

Cart/StickySummary

Elements:

- Item count
- Selected products
- Total amount
- Order review CTA

States:

- Empty
- Filled
- Expanded
- Updating
- Locked

Rules:

- Shared across touch and voice.
- Empty cart must not occupy excessive space.
- Total amount remains visible.
- Do not overlap essential product controls.

### 4.11 Order Summary

Component:

Order/Summary

Elements:

- Order type
- Product list
- Temperature
- Options
- Quantity
- Subtotal
- Discount
- Final amount

Used in:

- Final review
- Payment
- Order completion

### 4.12 Benefit Brand Tile

Component:

Benefit/BrandTile

Properties:

- brand_id
- brand_name
- logo
- benefit_type
- eligibility
- availability
- state

States:

- Default
- Selected
- Applied
- Unavailable
- Error

Rules:

- Preserve brand recognition.
- Display logo and brand name.
- Avoid hiding all brands behind one category.
- Use verified eligibility and benefit rules.

### 4.13 Payment Brand Tile

Component:

Payment/BrandTile

Properties:

- payment_method_id
- brand_name
- logo
- payment_group
- availability

States:

- Default
- Selected
- Processing
- Unavailable

Rules:

- Group by payment purpose.
- Preserve direct brand selection.
- Maintain official logo proportions.
- Do not use voice to activate payment.

### 4.14 Session Control

Component:

Session/Control

Elements:

- Clock icon
- Inactivity guidance
- Time extension action

Normal Copy:

"2분 동안 조작이 없으면 종료 안내가 표시돼요."

Rules:

- Use neutral colors.
- Do not emphasize normal countdown in red.
- Clearly distinguish inactivity from order duration.
- Show accurate remaining time when displayed.

### 4.15 Session Warning

Component:

Session/WarningModal

Title:

"아직 주문 중이신가요?"

Description:

"계속 주문하기를 누르면  
선택한 메뉴가 그대로 유지돼요."

Warning:

"60초 후 주문 내역이 초기화됩니다."

Actions:

- 계속 주문하기
- 주문 종료하기

Rules:

- Provide a visible countdown.
- Preserve cart when extending time.
- Explain the consequence of ending the order.
- Do not interrupt protected payment states.

### 4.16 Status Feedback

Component:

Feedback/Status

Variants:

- Loading
- Success
- Warning
- Error
- Unknown

Use for:

- Cart addition
- Voice processing
- Benefit application
- Payment processing
- Order submission

Never represent payment approval  
and order submission as the same status.

---

## 5. AI Interaction Patterns

### 5.1 Intent to UI Mapping

Customer Speech  
→ Speech-to-Text  
→ Intent Analysis  
→ Intent Validation  
→ Existing UI Action  
→ Visual Feedback  
→ Customer Decision

AI must not directly generate arbitrary layouts.

### 5.2 Supported Intent Mapping

| Intent | Example | UI Response |
|---|---|---|
| navigate_recommend | 메뉴 추천해 줘 | Recommendation category |
| navigate_new | 신메뉴 보여줘 | New menu category |
| navigate_decaf | 디카페인 있어? | Decaf category |
| navigate_category | 커피 보여줘 | Coffee category |
| select_product | 아메리카노 주세요 | Product configuration |
| set_temperature | 차갑게 주세요 | ICE selection |
| set_quantity | 두 잔 주세요 | Quantity update |
| set_option | 샷 추가해 줘 | Option selection |
| recommend_by_preference | 달달한 음료 추천해 줘 | Filtered product grid |
| confirm_item | 이걸로 담아줘 | Validated cart addition |
| continue_order | 하나 더 주문할게 | Menu exploration |
| finish_selection | 이제 됐어 | Voice end / Order review |
| unsupported_payment | 결제해 줘 | Direct interaction guidance |

Advanced recommendation and option intents  
may be implemented after the core MVP.

### 5.3 Conversational Loop

Listen  
→ Understand  
→ Show  
→ Ask if necessary  
→ Confirm  
→ Update  
→ Continue or End

### 5.4 Conversation Pattern A

General Recommendation

Customer:

"메뉴 추천해 줘."

AI Visual Response:

"추천 메뉴를 보여드릴게요."

UI:

Existing recommendation category.

Next Action:

"원하는 메뉴를 말하거나 눌러 주세요."

### 5.5 Conversation Pattern B

Specific Product

Customer:

"아이스 아메리카노 두 잔 주세요."

AI Visual Response:

"이렇게 담아드릴까요?"

UI:

- Product: 아메리카노
- Temperature: ICE
- Quantity: 2
- Price: Verified menu price
- Confirm
- Edit

### 5.6 Conversation Pattern C

Missing Required Information

Customer:

"카페라떼 주세요."

AI Visual Response:

"따뜻하게 드릴까요, 차갑게 드릴까요?"

UI:

- HOT / 따뜻하게
- ICE / 차갑게

Accept voice or touch response.

### 5.7 Conversation Pattern D

Preference Recommendation

Customer:

"달달하고 차가운 음료 추천해 줘."

AI Visual Response:

"달콤한 아이스 음료를 찾아봤어요."

UI:

Filtered existing product grid.

Show active recommendation conditions.

### 5.8 Conversation Pattern E

Recognition Failure

AI Visual Response:

"잘 듣지 못했어요."

Actions:

- 다시 말하기
- 화면에서 선택하기

Maintain existing cart and navigation.

### 5.9 Conversation Pattern F

Voice End

Customer:

"이제 됐어."

System:

- Stop microphone.
- Cancel pending voice requests.
- Preserve cart.
- Navigate to final review.

Visual Response:

"주문 내역을 확인해 주세요."

"할인, 적립 및 결제는 직접 선택해 주세요."

### 5.10 Voice States

| State | Visual Copy | Feedback |
|---|---|---|
| Idle | 음성으로 주문하기 | Mic icon |
| Listening | 듣고 있어요 | Wave + status text |
| Processing | 말씀하신 내용을 확인하고 있어요 | Progress indicator |
| Responding | Contextual response | Existing UI update |
| Awaiting input | Required question | Visible choices |
| Confirming | 이 메뉴가 맞나요? | Product summary |
| Success | 장바구니에 담았어요 | Check + cart update |
| Error | 잘 듣지 못했어요 | Retry / Touch |
| Ended | 이제 화면을 눌러 진행해 주세요 | Mic off |

### 5.11 Conversation Rules

- Ask one major question at a time.
- Do not repeat information already provided.
- Ask only for missing required information.
- Avoid unnecessary greetings and long responses.
- Show recognized speech when useful.
- Use clear and familiar Korean.
- Provide visual choices for every required question.
- Do not require customers to hear AI speech.
- Allow correction before cart addition.
- Do not interpret silence as confirmation.
- Stop listening when voice assistance ends.

### 5.12 Audio Output

Visual guidance is mandatory.

Audio guidance is optional.

Support:

- Audio on/off
- Replay
- Volume adjustment
- Speech speed adjustment

Advanced audio settings are enhancement scope.

No essential information may be audio-only.

---

## 6. Dynamic UI Rules

### 6.1 Component Reuse

Assemble UI from existing validated components.

Allowed components:

- CategoryTab
- FilterChip
- ProductCard
- ProductGrid
- ProductDetail
- ProductConfiguration
- SelectionCard
- QuantityStepper
- VoiceGuidanceBar
- CartItem
- OrderSummary

### 6.2 UI Adaptation Levels

Level 0:  
No adaptation.

Level 1:  
Navigate to an existing category.

Level 2:  
Filter an existing product grid.

Level 3:  
Open existing product detail or configuration.

Level 4:  
Populate validated product options.

Level 5:  
Confirm and update shared cart.

Payment actions are excluded.

### 6.3 Layout Stability

- Keep global navigation consistent.
- Keep major actions in predictable locations.
- Do not reorder categories unpredictably.
- Do not randomly change product card anatomy.
- Do not remove existing cart information.
- Do not introduce unnecessary layout shifts.

### 6.4 Context Awareness

The UI controller may use:

- Current screen
- Selected category
- Selected product
- Current options
- Cart state
- Order type
- Product availability
- Voice state

### 6.5 AI Action Constraints

Allowed:

- Navigate
- Filter
- Select
- Configure
- Ask
- Confirm item
- Add validated item
- End voice assistance

Not Allowed:

- Generate arbitrary UI
- Invent products
- Invent prices
- Invent benefits
- Collect personal information
- Execute payment
- Approve transactions
- Cancel paid orders

### 6.6 State Preservation

Preserve:

- Current cart
- Current order type
- Confirmed product options
- Navigation context
- Accessibility preferences

When switching between touch and voice,  
do not create a new order session.

### 6.7 Conflict Handling

If touch input occurs during voice processing:

- Respect the latest customer action.
- Cancel outdated voice requests.
- Reject stale responses.
- Do not overwrite newer selections.

---

## 7. Navigation Model

### 7.1 Main Navigation

Start  
→ Discover  
→ Select  
→ Customize  
→ Add to Cart  
→ Review  
→ Benefits  
→ Payment  
→ Complete

### 7.2 Interaction Zones

Multimodal Ordering Zone:

- Start
- Discover
- Select
- Customize
- Add to Cart

Supported Input:

- Touch
- Voice

Customer-controlled Zone:

- Final review
- Benefits
- Rewards
- Payment
- Completion

Supported Input:

- Direct customer interaction

### 7.3 Start Screen Layout

Top:

- MEGA MGC COFFEE identity
- Seasonal advertisement
- Collaboration campaign

Bottom:

- 매장에서 먹기
- 포장하기
- 음성으로 주문하기
- Language
- Accessibility

Rules:

- Advertisement does not block ordering.
- Dine-in and takeout have equal visual priority.
- Voice is an interaction method,
  not a separate consumption type.  
- Confirm order type when starting through voice.

### 7.4 Primary Menu Categories

Maintain the existing eight categories.

1. 신메뉴
2. 추천메뉴
3. 커피
4. 디카페인
5. 음료
6. 티
7. 푸드
8. 상품

### 7.5 Secondary Navigation

신메뉴:

- 전체
- 시즌 메뉴
- 콜라보 메뉴

추천메뉴:

- 추천·인기
- 할인 메뉴
- 세트 메뉴

커피:

- 전체
- Relevant product subcategories
- HOT / ICE filters

디카페인:

- 전체
- HOT / ICE filters

음료:

- 전체
- 라떼·밀크
- 스무디·프라페
- 주스·에이드
- 기타 음료

티:

- 전체
- 과일차
- 허브·블렌딩 티
- 아이스티

푸드:

- 전체
- 베이커리
- 디저트
- 샌드위치·간식

상품:

- 전체
- 굿즈
- 콜라보 상품

Secondary categories are proposals.

Validate the complete menu inventory and the  
meaning of existing 메가메뉴 before finalizing.

Do not remove existing product discovery paths  
without confirming their operational purpose.

### 7.6 Global Header

Elements:

- Brand identity
- Home
- Order type
- Language
- Voice trigger

Voice trigger appears only within  
the multimodal ordering zone.

### 7.7 Payment Navigation

Preserve supported benefit and payment brands.

Group by purpose:

1. Membership and benefits
2. Mega coupon
3. Card payment
4. Mobile payment
5. Gift certificates and prepaid cards
6. Stamp rewards

Use visual grouping without unnecessary  
additional navigation.

Actual benefit application and stamp reward  
sequence must follow verified operational rules.

### 7.8 Session Navigation

Normal:

Neutral inactivity guidance.

Warning:

Visible countdown and extension action.

Reset:

Return to start after safe unpaid-session cleanup.

Protected:

No ordinary timeout reset during payment  
or unresolved transaction status.

---

## 8. Accessibility

### 8.1 Accessibility Philosophy

Accessible by Default.

Visual-first.  
Voice-optional.  
Touch-compatible.

Do not assume all older customers  
have the same abilities or preferences.

### 8.2 Canvas and Layout

Reference Canvas:

- Width: 1080px
- Height: 1920px
- Orientation: Portrait
- Aspect ratio: 9:16
- Grid: 12 columns
- Margin: 40px
- Gutter: 24px

These are proposed design values.

Actual physical display size, resolution,  
pixel density and installation height  
must be confirmed.

### 8.3 Touch Targets

Proposed Design Targets:

- Minimum design target: 64 × 64px
- Standard control: 80px height
- Primary CTA: 104-112px height
- Physical target goal: 15-20mm
- Sufficient spacing between adjacent controls

Pixel values alone do not establish accessibility.

Validate physical touch size on actual hardware.

### 8.4 Contrast

Target:

- Normal text: at least 4.5:1
- Large text: at least 3:1
- Essential non-text controls: at least 3:1

Validate all actual foreground/background pairs.

Do not use color as the only status indicator.

### 8.5 Hearing Accessibility

- All AI responses displayed visually.
- All required questions displayed visually.
- All voice errors displayed visually.
- Audio can be disabled.
- No audio-only confirmation.
- No audio-only timeout warning.

### 8.6 Visual Accessibility

- Large readable text
- Strong contrast
- Clear selection indicators
- Consistent icon labels
- Optional magnification
- Avoid unnecessary visual clutter

### 8.7 Motor Accessibility

- Large touch targets
- Sufficient spacing
- Avoid drag-only actions
- Avoid gesture-only navigation
- Avoid precise timing requirements
- Validate physical reach of sticky header controls

If the upper voice trigger is difficult to reach,  
provide an accessible alternative placement.

### 8.8 Cognitive Accessibility

- Familiar terminology
- Predictable navigation
- One major question at a time
- Visible current order state
- Clear next action
- Required and optional information separated
- No unnecessary conversation

### 8.9 Time Accessibility

Proposed Session Policy:

- 120 seconds of inactivity before warning.
- 60 seconds of warning grace period.
- Extension available.
- Preserve unpaid cart when extending.
- Protect active payment sessions.

Use separate bounded timeouts for  
voice processing and system requests.

Actual timing requires operational validation.

### 8.10 Language

Proposed Language Support:

- Korean
- English
- Japanese
- Chinese

MVP:

Korean UI and Korean voice interaction.

Additional voice languages are future scope.

### 8.11 Accessibility Acceptance

- Complete touch ordering without voice.
- Complete voice-assisted ordering without audio.
- Recover from voice recognition failure.
- Extend session time without hearing audio.
- Identify selected options without color alone.
- Review exact product, options and total price.
- Access critical controls on actual hardware.

---

## 9. Data Contracts

### 9.1 Category

```json
{
  "id": "coffee",
  "name": "커피",
  "display_order": 3,
  "subcategories": [],
  "active": true
}
```

### 9.2 FoodCard / ProductCard

```json
{
  "id": "product_001",
  "name": "아메리카노",
  "image": null,
  "price": 2000,
  "description": "",
  "category_ids": ["coffee"],
  "tags": [],
  "temperature": ["HOT", "ICE"],
  "availability": true,
  "options": []
}
```

Product values are illustrative mock data.

### 9.3 Product Option

```json
{
  "id": "temperature",
  "name": "온도",
  "required": true,
  "selection_type": "single",
  "values": [
    {"id": "hot", "label": "HOT"},
    {"id": "ice", "label": "ICE"}
  ]
}
```

### 9.4 AI Suggestion

```json
{
  "product_id": "product_001",
  "context_tag": "차가운 음료",
  "recommendation_reason": "",
  "availability": true
}
```

### 9.5 Voice Intent

```json
{
  "intent": "navigate_recommend",
  "category_id": "recommended",
  "product_id": null,
  "temperature": null,
  "quantity": null,
  "requires_confirmation": false
}
```

### 9.6 Voice Guidance

```json
{
  "state": "responding",
  "transcript": "메뉴 추천해 줘",
  "response": "추천 메뉴를 보여드릴게요.",
  "instruction": "원하는 메뉴를 말하거나 눌러 주세요.",
  "audio_enabled": false
}
```

### 9.7 Cart Item

```json
{
  "cart_item_id": "cart_001",
  "product_id": "product_001",
  "temperature": "ICE",
  "quantity": 2,
  "unit_price": 2000,
  "options": [],
  "total_price": 4000
}
```

### 9.8 Shared Order State

```json
{
  "session_id": "session_001",
  "order_type": "takeout",
  "current_screen": "menu",
  "selected_category": "coffee",
  "voice_active": false,
  "voice_state": "idle",
  "cart": [],
  "subtotal": 0,
  "discount_total": 0,
  "total": 0,
  "payment_status": "not_started"
}
```

### 9.9 Payment Brand

```json
{
  "id": "payment_001",
  "name": "카드 결제",
  "logo": null,
  "group": "card",
  "available": true
}
```

### 9.10 Session State

```json
{
  "status": "active",
  "inactivity_seconds": 0,
  "warning_after_seconds": 120,
  "grace_period_seconds": 60,
  "payment_protected": false
}
```

### 9.11 Data Rules

- Product data comes from a validated catalog.
- Prices are calculated by the order system.
- AI cannot invent product or payment information.
- Voice intent must match an allowed action.
- Availability must be checked before cart addition.
- Cart mutations must prevent duplicate execution.
- Do not collect real payment information in the demo.
- Do not retain unnecessary voice recordings.

---

## 10. System Philosophy

UI adapts to customer intent,  
not to an unrestricted conversation.

The interface remains familiar,  
even when the input method changes.

AI is a navigation and selection assistant,  
not an autonomous ordering or payment agent.

The customer remains in control.

Brand identity, accessibility and business value  
are treated as complementary requirements.

Familiar Brand, Accessible Experience.

One Flow, Multiple Ways.

Reduce Decisions, Not Features.

Reduce Complexity, Not Visibility.

Speak to Select, Touch to Confirm.

Control, Not Pressure.

---

## 11. Screen Templates

### 11.1 Start Template

- Brand header
- Advertisement area
- Dine-in / Takeout actions
- Voice trigger
- Accessibility utilities

### 11.2 Menu Template

- Global header
- Conditional voice guidance
- Primary categories
- Secondary categories
- Product grid
- Session control
- Sticky cart

### 11.3 Product Template

- Product summary
- Required options
- Optional options
- Quantity
- Total price
- Add to cart

### 11.4 Voice-assisted Menu Template

Reuse Menu Template.

Additional elements:

- Active voice trigger
- Voice guidance bar
- Intent-related selection or filtering

Do not replace the entire menu layout.

### 11.5 Review Template

- Order type
- Order items
- Edit controls
- Total price
- Add more items
- Continue to payment

Voice trigger is removed.

### 11.6 Payment Template

- Order amount
- Benefits
- Coupon
- Card payment
- Mobile payment
- Gift and prepaid payment
- Stamp reward
- Payment help

Keep supported brand choices discoverable.

### 11.7 Completion Template

- Confirmed order status
- Order number
- Order amount
- Order type
- Pickup guidance
- Session completion

### 11.8 Warning Template

- Modal overlay
- Clear warning title
- Consequence explanation
- Remaining time
- Continue order
- End order

---

## 12. Business Design Patterns

### 12.1 Promotion Visibility

Preserve promotional entry points:

- Start screen advertisement
- New menu category
- NEW badge
- Collaboration category
- Relevant recommendation placement

Do not force advertisement interaction.

### 12.2 Partner Visibility

Preserve logos and names for existing  
supported benefits and payment methods.

Group by purpose rather than hiding brands.

### 12.3 Brand Asset Rules

- Use verified brand logos.
- Maintain logo proportions.
- Do not recolor partner logos arbitrarily.
- Use consistent logo containers.
- Use actual product photography.
- Do not present illustrative assets as official assets.

### 12.4 Recommendation Integrity

Generic recommendation:

Navigate to existing recommendation category.

Preference recommendation:

Prioritize customer-requested conditions.

Promotion:

Clearly identify promotional products.

Do not present sponsored placement as  
an objective personalized recommendation.

---

## 13. UX Writing

### 13.1 Tone and Voice

Friendly.  
Clear.  
Respectful.  
Action-oriented.

Avoid technical AI terminology  
in customer-facing instructions.

### 13.2 Writing Rules

- One instruction at a time.
- Use familiar Korean.
- Explain what happens next.
- Explain consequences before destructive actions.
- Avoid blaming the customer.
- Keep important information visible.

### 13.3 Voice Copy

Idle:

"음성으로 주문하기"

Listening:

"듣고 있어요."

Processing:

"말씀하신 내용을 확인하고 있어요."

Recommendation:

"추천 메뉴를 보여드릴게요."

Confirmation:

"이렇게 담아드릴까요?"

Error:

"잘 듣지 못했어요."

Fallback:

"다시 말하거나 화면에서 선택해 주세요."

End:

"이제 화면을 눌러 진행해 주세요."

### 13.4 Ordering Copy

Menu:

"어떤 메뉴를 드시겠어요?"

Temperature:

"따뜻하게 드릴까요, 차갑게 드릴까요?"

Cart:

"장바구니에 담았어요."

Review:

"주문 내역을 확인해 주세요."

### 13.5 Payment Copy

Benefits:

"받을 수 있는 혜택이 있나요?"

Payment:

"어떻게 결제하시겠어요?"

Processing:

"결제 정보를 확인하고 있어요."

Unknown:

"결제 결과를 확인하고 있어요.  
다시 결제하지 말고 잠시 기다려 주세요."

### 13.6 Session Copy

Normal:

"2분 동안 조작이 없으면  
종료 안내가 표시돼요."

Warning:

"아직 주문 중이신가요?"

Recovery:

"계속 주문하기를 누르면  
선택한 메뉴가 그대로 유지돼요."

---

## 14. Figma Design System Structure

### 00. Cover

- Project identity
- Version
- Design principles

### 01. Brand Audit

- Existing kiosk
- Mobile brand reference
- Brand assets
- Preserve / Adapt / Create

### 02. Foundations

- Primitive tokens
- Semantic tokens
- Color
- Typography
- Spacing
- Radius
- Grid
- Elevation
- Icons

### 03. Primitives

- Buttons
- Tabs
- Chips
- Badges
- Selection controls
- Quantity stepper

### 04. Components

- Product card
- Product grid
- Product detail
- Product configuration
- Cart item
- Sticky cart
- Order summary
- Benefit tile
- Payment tile

### 05. Voice Components

- Voice trigger
- Voice guidance
- Listening
- Processing
- Confirmation
- Error
- Voice end

### 06. Patterns

- Menu exploration
- Product selection
- Voice recommendation
- Voice-to-touch
- Payment grouping
- Session management
- Error recovery

### 07. Templates

- Start
- Menu
- Product
- Review
- Payment
- Completion

### 08. AS-IS

Existing kiosk analysis.

### 09. TO-BE

Final redesign screens.

### 10. Prototype

Touch and voice-assisted flows.

### 11. Usability Testing

- Test scenarios
- Observation
- Findings
- Iteration

### 12. Handoff

- Component specification
- Token mapping
- Data contracts
- Interaction rules
- Open questions

---

## 15. Component Naming Convention

Use hierarchical component names.

Examples:

```text
Button/Primary
Button/Secondary
Button/Dynamic
Button/Destructive

Navigation/CategoryTab
Navigation/FilterChip
Navigation/GlobalHeader

Product/Card
Product/Grid
Product/Detail
Product/Configuration
Product/SuggestionCard

Input/SelectionCard
Input/QuantityStepper

Voice/Trigger
Voice/GuidanceBar
Voice/Confirmation
Voice/Error

Cart/Item
Cart/StickySummary

Order/Summary

Benefit/BrandTile
Payment/BrandTile

Session/Control
Session/WarningModal

Feedback/Status
```

### Variant Properties

state:  
default / selected / pressed / disabled /  
loading / success / error

size:  
small / medium / large

voice_state:  
idle / listening / processing / responding /  
awaiting_input / confirming / success / error / ended

availability:  
available / sold_out / unavailable

audio:  
on / off

### Figma Variables

Collection: Primitive

- Color
- Typography values
- Spacing
- Radius

Collection: Semantic

- Background
- Text
- Border
- Action
- Selection
- Feedback
- Voice

Collection: Component

- Button
- Card
- Navigation
- Voice
- Cart
- Payment
- Session

Use semantic aliases rather than applying  
raw color values independently to each component.

---

## 16. Implementation Guidelines

### 16.1 UI Architecture

- Reusable component library
- Shared order state
- Validated menu catalog
- Intent-to-action mapping
- Conditional voice guidance
- Customer-controlled payment

### 16.2 Responsive Behavior

Design for the reference portrait canvas.

Use flexible layout containers.

Do not scale every text and control  
proportionally without considering readability.

Validate on the actual target display.

### 16.3 MVP Implementation Priority

P0:

- Brand foundations
- Primary and secondary buttons
- Category navigation
- Product cards
- Product configuration
- Shared cart
- Voice trigger
- Voice guidance
- General recommendation intent
- Product selection intent
- Temperature and quantity
- Voice error recovery
- Final review
- Mock payment
- Session warning

P1:

- Preference-based recommendations
- Advanced voice options
- Additional audio settings
- Magnification
- Additional languages
- Advanced payment recovery

### 16.4 Developer Constraints

- Do not expose API keys in frontend code.
- Validate AI responses.
- Use allowed UI actions only.
- Prevent stale voice responses.
- Prevent duplicate cart mutations.
- Keep payment APIs outside AI permissions.
- Use mock transactions for the prototype.

---

## 17. Design QA Checklist

### Brand

- [ ] Brand yellow and black applied consistently.
- [ ] Verified logos used.
- [ ] Product photography remains consistent.
- [ ] New menu and collaboration visibility preserved.

### Components

- [ ] Shared tokens applied.
- [ ] Component states defined.
- [ ] Touch targets validated.
- [ ] Selected states are clear.
- [ ] Disabled states are understandable.

### Navigation

- [ ] All eight categories directly accessible.
- [ ] Decaf category preserved.
- [ ] Existing product discovery paths preserved.
- [ ] Cart persists during navigation.

### Voice

- [ ] Voice trigger discoverable.
- [ ] Microphone state visible.
- [ ] Every AI response displayed visually.
- [ ] Existing UI reused for intent responses.
- [ ] Touch fallback available.
- [ ] Recognition errors recoverable.
- [ ] Voice ends before final review.
- [ ] Voice cannot execute payment.

### Payment

- [ ] Existing supported brands preserved.
- [ ] Benefit and payment groups understandable.
- [ ] Reward opportunity discoverable.
- [ ] Payment status clearly displayed.
- [ ] Unknown payment state prevents unsafe retry.

### Accessibility

- [ ] Text contrast validated.
- [ ] Control contrast validated.
- [ ] Essential controls physically reachable.
- [ ] Voice-free ordering possible.
- [ ] Audio-free voice assistance possible.
- [ ] Session extension available.
- [ ] Reduced motion considered.

### Validation

- [ ] Actual hardware specification confirmed.
- [ ] Official brand assets confirmed.
- [ ] Complete menu inventory confirmed.
- [ ] Payment policies confirmed.
- [ ] Session policy confirmed.
- [ ] User testing completed.
- [ ] Remaining limitations documented.

---

## 18. Validation & Open Questions

The following items remain unverified:

- Official brand color values
- Official typography
- Actual kiosk screen dimensions
- Actual pixel density
- Microphone and speaker availability
- Physical reach of upper controls
- Store noise conditions
- Complete menu inventory
- Existing recommendation policy
- Existing 메가메뉴 category meaning
- Partner benefit policies
- Payment and stamp reward sequence
- Existing session timeout behavior
- Accessibility compliance

Do not represent proposed values  
as verified production specifications.

All improvement claims require validation.

---

END OF DESIGN SYSTEM

UXPRESSO  
MEGA MGC COFFEE Kiosk Design System  
Version 2.0

Brand-driven.  
Intent-driven.  
Inclusive by Design.
