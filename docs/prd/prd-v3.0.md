# UXPRESSO — Product Requirements Document

> MEGA MGC COFFEE Kiosk UX/UI Redesign
> Version 3.0
> Voice-Driven & Inclusive UX
> 누구나 쉽게, 혼자서도 자신 있게.

---

# 00. Document Information

| Item | Description |
|---|---|
| Project Name | UXPRESSO |
| Product | 메가MGC커피 키오스크 개선 |
| Version | 3.0 |
| Status | Proposed / Pre-validation |
| Platform | Self-service Kiosk |
| Project Duration | 2 Days |
| Design Approach | Inclusive Design |
| Interaction | Touch + Voice |
| Reference | UXPRESSO Design System v1.0 |
| Screen Size | 1080 × 1920px (제안) |
| Language | 한국어 중심 |
| Deliverables | UX/UI Design, Design System, Interactive Prototype, API Demo, UT |

본 프로젝트는 메가MGC커피의 공식 프로젝트가 아닌  
기존 키오스크 경험을 기반으로 진행하는 UX/UI 개선 프로젝트이다.

실제 내부 API, 매출 데이터, 운영 정책 및 공식 디자인 시스템은  
확보하지 않은 상태이며, 모든 개선 효과는 검증 전 가설이다.

---

# 01. Product Overview

## 1.1 프로젝트명

UXPRESSO

UX + Espresso + Express

커피를 주문하는 과정에서 발생하는 디지털 사용 장벽을 낮추고,  
누구나 자신에게 익숙한 방식으로 주문할 수 있도록 개선한다.

## 1.2 Product Vision

누구나 쉽게, 혼자서도 자신 있게.

디지털 숙련도에 관계없이 고객이 타인의 도움 없이  
원하는 메뉴를 찾고 정확하게 주문할 수 있는 키오스크.

## 1.3 Product Mission

키오스크의 사용법을 학습해야 주문할 수 있는 경험에서  
고객이 원하는 것을 표현하면 주문할 수 있는 경험으로 개선한다.

기존 브랜드와 비즈니스 가치를 유지하면서  
메뉴 탐색, 선택, 주문 확인 및 결제 과정의 어려움을 줄인다.

## 1.4 Product Concept

One Flow, Multiple Ways.

하나의 주문 흐름 안에서 터치와 음성을 자유롭게 활용한다.

AI는 고객 대신 모든 주문을 결정하는 것이 아니라  
고객이 원하는 화면에 쉽게 도달하도록 돕는다.

## 1.5 Core Value

- Independence: 타인의 도움 없이 주문
- Clarity: 현재 상태와 다음 행동을 명확하게 이해
- Flexibility: 터치와 음성의 자유로운 전환
- Confidence: 정확한 주문에 대한 자신감
- Control: 주문 및 결제에 대한 고객의 통제권
- Business Value: 기존 브랜드 및 운영 가치 유지

---

# 02. Background & Problem Definition

## 2.1 Background

키오스크는 고객의 직접 주문을 지원하는 주요 접점이다.

하지만 고객은 주문을 완료하기 위해 다음 내용을 이해해야 한다.

- 메뉴 카테고리의 분류 기준
- 상품 탐색 방법
- 상품 상세 정보 확인 방법
- 필수 옵션 및 추가 옵션
- 장바구니 수정 방법
- 할인 및 적립 정책
- 다양한 결제 수단
- 주문 가능 시간 및 초기화 정책

디지털 기기 사용에 익숙하지 않은 고객에게  
이러한 과정은 주문의 진입 장벽이 될 수 있다.

## 2.2 AS-IS Observation

기존 키오스크 화면 및 사용자 제공 자료를 기반으로  
다음과 같은 구조적 특징을 확인하였다.

- 8개의 주요 메뉴 카테고리
- 다수의 하위 카테고리
- 상품 이미지 중심의 메뉴 목록
- HOT / ICE 상품 구분
- 상품 상세 및 옵션 선택 화면
- 장바구니 및 주문 금액 표시
- 다양한 할인, 적립 및 결제 브랜드
- 화면 하단의 주문 관련 시간 표시
- 언어 선택 및 접근성 기능

이러한 기능 자체를 문제로 규정하지 않는다.

기존 기능의 장점과 운영 목적을 유지하면서  
고객이 정보를 이해하고 선택하는 방식의 개선 가능성을 탐색한다.

## 2.3 Problem Hypotheses

### P01. 메뉴 탐색의 어려움

고객이 원하는 메뉴를 찾기 위해  
카테고리의 분류 기준을 먼저 이해해야 할 수 있다.

### P02. 정보 선택의 복잡성

다수의 상품, 옵션, 혜택 및 결제 브랜드가  
비슷한 시각적 위계로 제공될 경우  
고객이 다음 행동을 판단하기 어려울 수 있다.

### P03. 디지털 조작 부담

터치 중심 주문 과정에서  
디지털 숙련도가 낮은 고객은  
메뉴 탐색 및 화면 이동에 어려움을 겪을 수 있다.

### P04. 시간 압박

주문 화면의 남은 시간 표시가  
고객에게 전체 주문 제한 시간으로 인식될 경우  
충분히 고민하거나 상품 정보를 읽기 어려울 수 있다.

### P05. 오류 복구의 어려움

잘못된 선택, 인식 실패, 결제 오류 등이 발생했을 때  
고객이 기존 주문을 유지하면서 복구하기 어려울 수 있다.

위 문제는 실제 사용자 테스트를 통해 검증해야 한다.

## 2.4 Core Problem

고객이 원하는 메뉴를 주문하기 위해  
키오스크의 사용 방식과 정보구조를 먼저 학습해야 한다.

이러한 학습 및 조작 부담은  
디지털 숙련도가 낮은 고객의 독립적인 주문을  
방해하는 요인이 될 수 있다.

## 2.5 How Might We

어떻게 하면 디지털 환경에 익숙하지 않은 고객도  
타인의 도움 없이 키오스크를 이해하고,  
자신 있게 주문을 완료할 수 있을까?

## 2.6 Design Opportunity

고객이 메뉴의 분류 체계를 이해하지 못하더라도  
자신이 원하는 것을 말하거나 화면에서 선택하여  
동일한 주문 결과에 도달할 수 있도록 한다.

---

# 03. Goals & Non-Goals

## 3.1 Primary Goal

디지털 숙련도가 낮은 고객의  
독립적이고 정확한 주문 완료를 지원한다.

## 3.2 Secondary Goals

- 메뉴 탐색 부담 감소
- 주문 과정의 이해도 향상
- 음성 및 터치 입력의 자연스러운 전환
- 잘못된 주문 및 옵션 선택 예방
- 오류 발생 시 복구 가능성 향상
- 할인 및 적립 혜택 발견 가능성 유지
- 주문 과정에서 느끼는 시간 압박 완화
- 고객의 주문 자신감 향상

## 3.3 Business Goals

- 신메뉴 및 시즌 메뉴 노출 유지
- 콜라보 상품 홍보 기회 유지
- 제휴 혜택 및 결제 브랜드 가시성 유지
- 기존 고객의 익숙한 주문 경험 유지
- 방치된 주문 세션의 안전한 정리
- 직원의 주문 보조 업무 감소 가능성 탐색
- 기존 UI 및 컴포넌트 재사용

직원 업무 감소 및 매출 관련 효과는  
실제 운영 데이터를 확보한 이후 검증한다.

## 3.4 Non-Goals

- 주문 속도만을 최우선으로 최적화하지 않는다.
- 기존 기능을 무조건 제거하지 않는다.
- 메뉴 카테고리를 단순히 줄이는 것을 목표로 하지 않는다.
- AI 음성 주문을 모든 고객에게 강제하지 않는다.
- AI가 고객 대신 결제를 실행하지 않는다.
- 실제 매출 증가를 검증 없이 주장하지 않는다.
- 실제 메가커피 내부 시스템을 연동하지 않는다.

---

# 04. Target Users

## 4.1 Primary Users

디지털 기기 사용에 어려움을 느끼는 고객.

특징:

- 키오스크 정보구조가 익숙하지 않음
- 메뉴 탐색 과정에서 어려움을 느낄 수 있음
- 화면 조작보다 말로 표현하는 방식이 익숙할 수 있음
- 상품 선택 및 결제 과정에서 실수를 걱정할 수 있음
- 충분한 탐색 및 판단 시간이 필요할 수 있음

고령층을 주요 고려 대상으로 포함하되  
연령만으로 디지털 숙련도를 판단하지 않는다.

## 4.2 Secondary Users

일반적인 키오스크 이용 고객.

- 원하는 메뉴를 빠르게 찾고 싶은 고객
- 다양한 메뉴를 비교하고 싶은 고객
- 신메뉴 및 콜라보 상품에 관심 있는 고객
- 디카페인 등 특정 상품군을 찾는 고객
- 할인 및 적립 혜택을 이용하려는 고객
- 상황에 따라 음성 주문을 이용하고 싶은 고객

## 4.3 Accessibility Users

- 작은 글자를 읽기 어려운 고객
- 음성 안내를 듣기 어려운 고객
- 터치 조작에 어려움을 느끼는 고객
- 정보 처리에 충분한 시간이 필요한 고객
- 화면 상단까지 손을 뻗기 어려운 고객

## 4.4 Stakeholders

### Customer

정확하고 이해하기 쉬운 주문 경험.

### Store Staff

고객 주문 보조 및 오류 대응 부담 완화 가능성.

### Store Operator

세션 관리 및 매장 운영 효율 유지.

### Brand

신메뉴, 콜라보 및 브랜드 경험 유지.

### Business Partner

제휴 혜택 및 결제 브랜드 노출 유지.

### Developer

기존 UI 및 주문 데이터 재사용을 통한 구현 효율.

---

# 05. Jobs To Be Done

## JTBD 01. 메뉴 탐색

When:  
원하는 메뉴가 있지만 어느 카테고리에 있는지 모를 때,

I want:  
메뉴 이름이나 원하는 특징을 말해서 찾고 싶다.

So that:  
키오스크의 분류 체계를 이해하지 않아도 주문할 수 있다.

## JTBD 02. 메뉴 추천

When:  
어떤 음료를 주문해야 할지 모르겠을 때,

I want:  
추천 메뉴나 내 취향에 맞는 메뉴를 확인하고 싶다.

So that:  
많은 상품 중에서 어렵지 않게 선택할 수 있다.

## JTBD 03. 주문 확인

When:  
상품과 옵션을 선택했을 때,

I want:  
내가 선택한 메뉴와 금액을 명확하게 확인하고 싶다.

So that:  
잘못된 주문을 예방할 수 있다.

## JTBD 04. 입력 방식 전환

When:  
화면 조작이 어렵거나 말로 주문하는 것이 더 편할 때,

I want:  
현재 주문을 유지하면서 음성 주문으로 전환하고 싶다.

So that:  
처음부터 다시 주문하지 않아도 된다.

## JTBD 05. 혜택 발견

When:  
결제하기 전에 이용 가능한 혜택을 확인할 때,

I want:  
내가 사용하는 멤버십과 결제 브랜드를 한눈에 찾고 싶다.

So that:  
받을 수 있는 혜택을 놓치지 않는다.

## JTBD 06. 충분한 주문 시간

When:  
메뉴를 고민하거나 상품 정보를 읽고 있을 때,

I want:  
필요한 만큼 시간을 확보하고 싶다.

So that:  
시간에 쫓기지 않고 정확하게 주문할 수 있다.

---

# 06. Design Principles

## 6.1 Familiar Brand, Accessible Experience

기존 브랜드의 익숙함을 유지하면서  
누구나 접근할 수 있는 주문 경험을 제공한다.

## 6.2 Reduce Decisions, Not Features

기능의 개수를 줄이는 것이 아니라  
고객이 판단해야 하는 복잡성을 줄인다.

## 6.3 Reduce Complexity, Not Visibility

상품 및 제휴 브랜드를 숨기지 않는다.

정보의 그룹화와 시각적 위계를 개선한다.

## 6.4 One Flow, Multiple Ways

터치와 음성은 하나의 주문 흐름을 공유한다.

## 6.5 Speak · See · Touch

Speak:  
원하는 것을 말한다.

See:  
인식 결과와 다음 행동을 화면에서 확인한다.

Touch:  
필요한 경우 직접 선택하고 수정한다.

## 6.6 Speak to Select, Touch to Confirm

메뉴 선택 및 구성은 음성으로 지원한다.

최종 주문 확인, 혜택 적용, 적립 및 결제는  
고객이 직접 조작한다.

## 6.7 Control, Not Pressure

매장 운영을 위한 세션 관리 기능을 유지하되  
고객이 주문 시간을 통제할 수 있도록 한다.

## 6.8 Accessible by Default

접근성 설정을 별도로 활성화하지 않아도  
기본 화면 자체가 이해하기 쉬워야 한다.

---

# 07. AS-IS / TO-BE Strategy

| Area | AS-IS | TO-BE |
|---|---|---|
| 첫 화면 | 기존 주문 진입 구조 | 상단 AD + 명확한 주문 진입 |
| 브랜드 | 기존 메가커피 아이덴티티 | 유지 |
| 메뉴 IA | 기존 8개 대분류 | 8개 유지 및 하위 구조 개선 |
| 상품 탐색 | 카테고리 중심 | 카테고리 + 자연어 탐색 |
| 상품 카드 | 이미지 및 가격 중심 | 정보 위계 및 가독성 개선 |
| 상품 상세 | 별도 상세 정보 | 명확한 상세 확인 및 주문 연결 |
| 옵션 | 다수의 옵션 선택 | 필수 / 선택 옵션 구분 |
| 입력 방식 | 터치 중심 | 터치 + 음성 |
| 음성 주문 | 개선 프로젝트 신규 기능 | 기존 UI 연결 방식 |
| 장바구니 | 기존 주문 목록 | 수정 및 확인 강화 |
| 결제 | 다수의 결제 브랜드 노출 | 브랜드 유지 및 목적별 그룹화 |
| 시간 표시 | 남은 시간 강조 | 미사용 기준 및 연장 기능 |
| 오류 복구 | 추가 확인 필요 | 상태 유지 및 복구 행동 제공 |
| 접근성 | 별도 접근성 기능 | 기본 UI 개선 + 선택적 지원 |

AS-IS 기능의 실제 세부 동작은  
현장 확인 후 보완한다.

---

# 08. Product Scope

## 8.1 P0 — MVP

반드시 구현해야 하는 핵심 범위.

- 첫 화면 및 AD
- 매장 식사 / 포장 선택
- 기존 8개 메뉴 카테고리
- 상품 목록
- 상품 상세
- 상품 옵션
- 장바구니
- 최종 주문 확인
- 음성 주문 활성화 및 종료
- 음성 의도에 따른 기존 UI 이동
- 음성 인식 결과 표시
- 일반 메뉴 추천
- 특정 상품 음성 선택
- 온도 및 수량 선택
- 음성 인식 실패 복구
- 터치 / 음성 주문 상태 공유
- 할인 및 결제 브랜드 그룹화
- 모의 결제
- 주문 완료
- 세션 종료 전 안내
- 기본 접근성 적용

## 8.2 P1 — Enhancement

핵심 프로토타입 이후 구현.

- 취향 기반 상품 추천
- 가격 조건 기반 상품 탐색
- 상품 설명 음성 질문
- 음성으로 추가 옵션 변경
- 음성 안내 다시 듣기
- 음량 및 음성 속도 조절
- 확대 및 접근성 설정
- 다국어 UI
- 모의 쿠폰 적용
- 모의 스탬프 적립
- 결제 오류 및 상태 불명확 시나리오

## 8.3 P2 — Future Consideration

- 실제 POS 연동
- 실시간 재고 연동
- 실제 프로모션 및 쿠폰 API 연동
- 실제 결제 단말기 연동
- 다국어 음성 인식
- 매장별 메뉴 추천
- 실제 운영 데이터 기반 인기 메뉴 추천
- 매장 소음 환경 최적화
- 실제 기기 접근성 검증

## 8.4 Out of Scope

- 실제 결제 처리
- 음성 결제 실행
- 실제 개인정보 수집
- 직원용 POS 리디자인
- 상품 제조 및 수령 시스템
- 모바일 앱 전체 리디자인
- 회원가입 및 로그인 시스템
- 고객 생체정보 인식
- 실제 매출 및 운영 효과 검증

---

# 09. Information Architecture

## 9.1 Primary Navigation

기존 8개 대분류를 유지한다.

1. 신메뉴
2. 추천메뉴
3. 커피
4. 디카페인
5. 음료
6. 티
7. 푸드
8. 상품

## 9.2 Secondary Navigation

### 신메뉴

- 전체
- 시즌 메뉴
- 콜라보 메뉴

### 추천메뉴

- 추천·인기
- 할인 메뉴
- 세트 메뉴

### 커피

- 전체
- 상품 유형별 하위 분류 (필요 시)

온도 필터:

- HOT
- ICE

### 디카페인

- 전체

온도 필터:

- HOT
- ICE

### 음료

- 전체
- 라떼·밀크
- 스무디·프라페
- 주스·에이드
- 기타 음료

### 티

- 전체
- 과일차
- 허브·블렌딩 티
- 아이스티

### 푸드

- 전체
- 베이커리
- 디저트
- 샌드위치·간식

### 상품

- 전체
- 굿즈
- 콜라보 상품

하위 정보구조는 초기 제안이다.

기존 메가메뉴의 운영상 의미와 전체 판매 상품을 확인한 후  
최종 분류를 확정한다.

기존 상품 및 프로모션의 탐색 경로가  
의도하지 않게 제거되지 않도록 검증한다.

## 9.3 IA Rules

- 주요 카테고리는 한 화면에서 직접 접근 가능
- 디카페인은 독립 카테고리로 유지
- 음료와 티는 독립 카테고리로 유지
- 신메뉴 및 콜라보 상품의 노출 유지
- 동일 상품의 여러 탐색 경로 허용
- 상품 ID는 중복 생성하지 않음
- HOT / ICE는 상품 속성 또는 필터로 처리
- 추천과 인기의 의미를 구분
- 검증되지 않은 인기 순위를 표시하지 않음

---

# 10. User Journey

## 10.1 Main Journey

| Stage | Customer Goal | Design Opportunity |
|---|---|---|
| Start | 주문 시작 | 명확한 진입점 |
| Explore | 원하는 메뉴 찾기 | 카테고리 및 음성 탐색 |
| Select | 상품 선택 | 상품 정보 가독성 |
| Configure | 옵션 선택 | 필수 및 선택 옵션 구분 |
| Cart | 주문 내역 확인 | 수정 및 상태 유지 |
| Review | 최종 주문 확인 | 정확한 주문 확인 |
| Benefits | 혜택 발견 | 브랜드 가시성 유지 |
| Payment | 직접 결제 | 명확한 결제 안내 |
| Complete | 주문 완료 확인 | 주문번호 및 상태 제공 |

## 10.2 Main User Flow

```text
Start
  ↓
매장 식사 / 포장
  ↓
메뉴 탐색
  ↓
상품 선택
  ↓
필수 및 선택 옵션
  ↓
장바구니 담기
  ↓
추가 메뉴 주문 여부
  ├─ Yes → 메뉴 탐색
  └─ No
       ↓
     최종 주문 확인
       ↓
     할인 / 적립 / 결제 방법
       ↓
     결제 처리
       ↓
     주문 접수 확인
       ↓
     주문 완료
```

## 10.3 Voice User Flow

```text
Start Screen 또는 Sticky Header
  ↓
음성으로 주문하기
  ↓
마이크 활성화
  ↓
고객 발화
  ↓
Speech-to-Text
  ↓
Intent Analysis
  ↓
Intent Validation
  ↓
기존 UI 연결
  ↓
필요한 정보 확인
  ↓
상품 및 옵션 확인
  ↓
장바구니 담기
  ↓
추가 메뉴 주문 여부
  ├─ Yes → 음성 또는 터치 주문
  └─ No
       ↓
     음성 주문 종료
       ↓
     최종 주문 확인
       ↓
     고객 직접 조작
       ↓
     결제 및 주문 완료
```

## 10.4 Voice-to-Touch Flow

```text
음성 주문 중
  ↓
화면에서 선택하기
  ↓
마이크 비활성화
  ↓
현재 화면 및 주문 상태 유지
  ↓
터치 주문 진행
```

## 10.5 Touch-to-Voice Flow

```text
터치 주문 중
  ↓
Sticky Header 음성 주문 버튼
  ↓
마이크 활성화
  ↓
현재 화면 및 장바구니 유지
  ↓
음성 주문 진행
```

---

# 11. Functional Requirements

Priority Definition:

- P0: MVP 필수
- P1: 개선 및 확장
- P2: 향후 검토

## FR-01. Start Screen

Priority: P0

### Description

상단에 브랜드 광고를 노출하고  
하단에 명확한 주문 시작 기능을 제공한다.

### Requirements

- 상단 시즌 AD 및 콜라보 홍보
- 매장에서 먹기
- 포장하기
- 음성으로 주문하기
- 언어 선택
- 접근성 기능
- 광고와 주문 버튼의 시각적 분리
- 광고 변경 중에도 주문 버튼 위치 유지

### Acceptance Criteria

- 고객이 광고 시청을 완료하지 않아도 주문할 수 있다.
- 매장 식사와 포장 선택이 명확하게 구분된다.
- 음성 주문이 별도의 주문 유형이 아님을 이해할 수 있다.
- 음성으로 시작한 경우 주문 유형을 확인할 수 있다.

---

## FR-02. Category Navigation

Priority: P0

### Description

기존 8개 대분류를 유지하면서  
상품 탐색의 시각적 위계를 개선한다.

### Requirements

- 8개 대분류 직접 노출
- 현재 카테고리 강조
- 하위 카테고리 제공
- 필요한 상품군에만 필터 제공
- 상품 목록 갱신
- 카테고리 변경 시 장바구니 유지

### Acceptance Criteria

- 디카페인 카테고리에 직접 접근할 수 있다.
- 신메뉴 및 콜라보 상품을 발견할 수 있다.
- 현재 선택한 카테고리를 명확하게 확인할 수 있다.
- 카테고리 이동으로 기존 주문이 삭제되지 않는다.

---

## FR-03. Product List

Priority: P0

### Requirements

- 상품 이미지
- 상품명
- 가격
- HOT / ICE 정보
- 상품 상세 확인
- 상품 배지
- 품절 상태
- 필요한 경우 한 줄 설명

### Acceptance Criteria

- 상품 선택 전에 상품명과 가격을 확인할 수 있다.
- 품절 상품을 주문할 수 없다.
- 상세 정보와 주문 행동을 구분할 수 있다.
- 상품 배지는 실제 메뉴 데이터와 일치한다.

---

## FR-04. Product Detail

Priority: P0

### Requirements

- 상품 이미지
- 상품명
- 상품 설명
- 가격
- 검증된 상품 정보
- 상품 선택 CTA
- 닫기

### Acceptance Criteria

- 상세 정보를 확인한 후 상품 선택으로 이동할 수 있다.
- 상세 화면을 닫으면 기존 탐색 위치를 유지한다.
- AI가 확인되지 않은 상품 정보를 생성하지 않는다.

---

## FR-05. Product Configuration

Priority: P0

### Requirements

- HOT / ICE 선택
- 수량 선택
- 필수 옵션
- 선택 옵션
- 추가 옵션 가격
- 실시간 주문 금액
- 장바구니 담기

### Acceptance Criteria

- 필수 옵션을 선택하지 않으면 상품을 확정할 수 없다.
- 선택 옵션을 강제로 선택하지 않아도 된다.
- 추가 옵션에 따른 금액을 즉시 확인할 수 있다.
- 판매하지 않는 옵션을 선택할 수 없다.

---

## FR-06. Shared Cart

Priority: P0

### Description

터치와 음성 주문이 동일한 장바구니를 사용한다.

### Requirements

- 상품 추가
- 상품 삭제
- 수량 수정
- 옵션 수정
- 주문 금액 계산
- 입력 방식 전환 시 상태 유지

### Acceptance Criteria

- 터치에서 음성으로 전환해도 상품이 유지된다.
- 음성에서 터치로 전환해도 상품이 유지된다.
- 동일한 음성 명령의 중복 처리로 상품이 추가되지 않는다.
- 수량 및 옵션 변경 후 금액이 정확하게 갱신된다.

---

## FR-07. Sticky Voice Trigger

Priority: P0

### Description

메뉴 탐색 및 상품 선택 과정에서  
고객이 언제든 음성 주문을 활성화할 수 있다.

### Requirements

- Global Header 내 음성 주문 버튼
- 화면 이동 중 동일한 위치 유지
- 음성 활성화 상태 표시
- 음성 주문 종료 기능
- 마이크 사용 불가 상태 안내

### Acceptance Criteria

- 메뉴 탐색 중 음성 주문을 시작할 수 있다.
- 상품 옵션 선택 중 음성 주문을 시작할 수 있다.
- 현재 상품과 옵션이 유지된다.
- 최종 주문 확인 이후에는 음성 주문 버튼이 노출되지 않는다.
- 음성 버튼의 실제 물리적 도달 가능성을 검증한다.

---

## FR-08. Voice Guidance Bar

Priority: P0

### Description

AI 음성 안내를 듣지 않아도  
고객이 현재 상태와 다음 행동을 이해할 수 있도록 한다.

### Requirements

- 마이크 상태
- 인식된 고객 발화
- AI 응답
- 다음 행동 안내
- 음성 주문 종료
- 음성 안내 켜기 / 끄기
- 다시 말하기

### Example

말씀하신 내용:  
"메뉴 추천해 줘."

AI 안내:  
"추천 메뉴를 보여드릴게요."

다음 행동:  
"원하는 메뉴를 말하거나 눌러 주세요."

### Acceptance Criteria

- 모든 AI 안내가 화면에 표시된다.
- 소리를 듣지 않고도 주문을 이어갈 수 있다.
- 음성 인식 결과를 확인할 수 있다.
- 음성 주문을 종료하면 안내 영역이 사라진다.
- 기존 상품 탐색 영역을 과도하게 침범하지 않는다.

---

## FR-09. Voice Intent Navigation

Priority: P0

### Description

고객의 자연어를 분석하여  
사전에 정의된 기존 UI로 연결한다.

### Supported Intents

- navigate_category
- navigate_recommend
- navigate_new
- navigate_decaf
- select_product
- set_temperature
- set_quantity
- confirm_item
- continue_order
- finish_selection

### Acceptance Criteria

- "메뉴 추천해 줘" 발화 시 추천메뉴 UI로 이동한다.
- "디카페인 보여줘" 발화 시 디카페인 UI로 이동한다.
- 특정 상품 요청 시 상품 옵션 UI로 이동한다.
- 현재 화면에서 해결 가능한 요청은 화면을 유지한다.
- 지원하지 않는 요청으로 임의의 화면을 생성하지 않는다.

---

## FR-10. Preference-based Recommendation

Priority: P1

### Description

고객의 취향 및 조건을 기준으로  
실제 판매 상품을 추천한다.

### Supported Conditions

- 맛
- 온도
- 상품 유형
- 가격
- 카페인 관련 상품 속성
- 상품 판매 가능 여부

### Example

Customer:  
달달하고 차가운 음료 추천해 줘.

System:  
달콤한 아이스 음료를 찾아봤어요.

UI:  
조건에 맞는 상품 목록.

### Acceptance Criteria

- 추천 결과가 실제 메뉴 데이터에 존재한다.
- 추천 조건을 화면에서 확인할 수 있다.
- 조건을 수정하거나 전체 메뉴로 돌아갈 수 있다.
- 조건에 맞는 상품이 없으면 명확하게 안내한다.
- AI가 상품명, 가격, 성분을 임의로 생성하지 않는다.

---

## FR-11. Voice Order Configuration

Priority: P0

### Description

고객의 발화에서 상품과 필수 주문 정보를 추출한다.

### Example

"아이스 아메리카노 두 잔 주세요."

Extracted Information:

- Product: 아메리카노
- Temperature: ICE
- Quantity: 2

### Requirements

- 상품 식별
- 온도 추출
- 수량 추출
- 지원되는 옵션 확인
- 부족한 필수 정보 질문
- 상품 및 금액 확인

### Acceptance Criteria

- 이미 입력된 정보를 반복 질문하지 않는다.
- 부족한 필수 정보만 질문한다.
- 음성 또는 터치로 응답할 수 있다.
- 상품 확정 전 메뉴, 수량, 옵션 및 가격을 확인할 수 있다.
- 잘못된 인식 결과를 수정할 수 있다.

---

## FR-12. Voice Error Recovery

Priority: P0

### Requirements

- 인식 실패 안내
- 다시 말하기
- 화면에서 선택하기
- 후보 상품 선택
- 기존 화면 유지
- 장바구니 유지

### Acceptance Criteria

- 음성 인식 실패로 주문 전체가 초기화되지 않는다.
- 고객이 터치 주문으로 전환할 수 있다.
- 모호한 상품 요청을 임의로 확정하지 않는다.
- 주변 고객의 음성으로 상품이 자동 확정되지 않는다.

---

## FR-13. Voice-to-Touch Transition

Priority: P0

### Description

메뉴 담기 이후 음성 주문을 종료하고  
고객 직접 조작 단계로 전환한다.

### Trigger

- 고객이 주문 확인 버튼을 선택
- 고객이 메뉴 선택 완료 의사를 표현

### UI Copy

"주문 내역을 확인해 주세요."

"이제 화면을 눌러 진행해 주세요."

"할인, 적립 및 결제는 직접 선택해 주세요."

### Acceptance Criteria

- 최종 주문 확인 화면 진입 시 마이크가 종료된다.
- 기존 주문 내역이 유지된다.
- 음성으로 결제를 실행할 수 없다.
- 메뉴 추가를 위해 돌아가면 음성 기능을 다시 이용할 수 있다.
- 이전 화면 복귀만으로 마이크가 자동 활성화되지 않는다.

---

## FR-14. Order Review

Priority: P0

### Requirements

- 상품명
- 온도
- 수량
- 옵션
- 주문 유형
- 총 주문 금액
- 상품 수정
- 메뉴 더 담기
- 결제 방법 선택

### Acceptance Criteria

- 고객이 모든 주문 내용을 직접 확인할 수 있다.
- 잘못된 상품 및 옵션을 수정할 수 있다.
- 수정 후 최종 금액이 갱신된다.
- 결제는 고객의 직접적인 행동으로 시작된다.

---

## FR-15. Benefits & Payment Discovery

Priority: P0

### Description

기존 할인, 적립 및 결제 브랜드를 유지하면서  
목적에 따라 시각적으로 그룹화한다.

### Requirements

- 결제 금액
- 할인 및 제휴 혜택
- 메가커피 쿠폰
- 카드 결제
- 모바일 간편결제
- 상품권 및 선불카드
- 스탬프 적립
- 결제 관련 도움말

### Acceptance Criteria

- 기존 지원 브랜드가 누락되지 않는다.
- 브랜드 로고 및 이름을 확인할 수 있다.
- 결제 브랜드 선택을 위해 불필요한 중간 화면을 거치지 않는다.
- 혜택이 없는 고객은 바로 결제 방법을 선택할 수 있다.
- 적립 기회를 놓치지 않도록 안내한다.

---

## FR-16. Payment Processing

Priority: P0

### Requirements

- 고객 직접 결제 수단 선택
- 결제 방법별 안내
- 결제 처리 상태 표시
- 결제 승인 결과 확인
- 주문 접수 상태 확인
- 중복 결제 방지

### Acceptance Criteria

- 음성 명령으로 결제할 수 없다.
- 결제 처리 중 중복 요청이 발생하지 않는다.
- 결제 승인 전 주문 완료를 표시하지 않는다.
- 결제 승인과 주문 접수를 구분한다.
- 결제 결과가 불명확하면 즉시 재결제시키지 않는다.

MVP에서는 실제 결제가 아닌  
모의 결제 상태를 사용한다.

---

## FR-17. Session Management

Priority: P0

### Description

매장 운영을 위한 세션 초기화 기능을 유지하면서  
고객의 시간 압박을 줄인다.

### Proposed Policy

- 미사용 120초 후 종료 안내
- 종료 안내 후 60초 유예
- 총 미사용 180초 후 미결제 세션 초기화

### Requirements

- 미사용 기준 시간 관리
- 일반 상태의 중립적 시간 안내
- 시간 연장
- 종료 전 경고
- 기존 주문 유지
- 결제 중 세션 보호

### Normal Copy

"2분 동안 조작이 없으면 종료 안내가 표시돼요."

### Warning Copy

"아직 주문 중이신가요?"

"계속 주문하기를 누르면 선택한 메뉴가 그대로 유지돼요."

"60초 후 주문 내역이 초기화됩니다."

### Actions

- 계속 주문하기
- 주문 종료하기

### Acceptance Criteria

- 주문 중 전체 이용 시간 제한으로 오해하지 않는다.
- 고객이 시간을 연장할 수 있다.
- 초기화 전 안내가 표시된다.
- 계속 주문하기 선택 시 장바구니가 유지된다.
- 결제 중 또는 결제 상태가 불명확할 때 초기화하지 않는다.

실제 시간 수치와 기존 타이머 동작은  
현장 검증 이후 확정한다.

---

## FR-18. Order Completion

Priority: P0

### Requirements

- 주문 완료 상태
- 주문번호
- 주문 유형
- 주문 금액
- 상품 수령 안내
- 세션 종료

### Acceptance Criteria

- 주문 접수가 확인된 경우에만 완료를 표시한다.
- 주문번호를 충분히 확인할 수 있다.
- 다음 고객에게 이전 고객의 정보가 노출되지 않는다.
- 주문 완료 후 안전하게 초기 화면으로 복귀한다.

---

## FR-19. Accessibility

Priority: P0 / P1

### Requirements

P0:

- 충분한 글자 크기
- 명확한 명도 대비
- 충분한 터치 영역
- 아이콘 및 텍스트 병행
- 색상 외 선택 상태 표현
- 화면 중심 음성 안내
- 오류 복구
- 충분한 응답 시간

P1:

- 화면 확대
- 음량 조절
- 음성 속도 조절
- 다시 듣기
- 추가 시간 설정
- 다국어 지원

### Acceptance Criteria

- 음성 안내 없이 주문할 수 있다.
- 음성 주문 없이 전체 주문을 완료할 수 있다.
- 주요 행동을 색상만으로 판단하지 않는다.
- 실제 기기에서 주요 조작 영역에 접근할 수 있다.

---

# 12. Voice UX Specification

## 12.1 Voice-Driven UI Definition

고객의 자연어를 분석하고  
기존 키오스크의 화면 및 기능으로 연결하는 인터페이스.

AI 챗봇처럼 대화 기록을 중심으로 주문하지 않는다.

기존 상품 목록, 카테고리, 상품 상세, 옵션 UI가  
음성 입력의 결과로 나타난다.

## 12.2 Interaction Model

Input:

- Touch
- Voice

Output:

- Visual: Default
- Audio: Optional

음성 출력은 보조 수단이다.

모든 질문과 결과는 화면에서 확인할 수 있어야 한다.

## 12.3 Activation Policy

음성 주문은 고객이 명시적으로 활성화한다.

진입점:

- 첫 화면
- 메뉴 화면 Sticky Header
- 상품 상세 및 옵션 단계

음성 주문 중에도 터치 입력을 사용할 수 있다.

마이크가 활성화된 상태를 명확하게 표시한다.

## 12.4 Listening Policy

프로토타입 기본 제안:

- 고객이 음성 주문 버튼을 누르면 입력 시작
- 발화 중 시각적 인식 상태 표시
- 말하기 완료 또는 발화 종료 감지
- 인식 처리 중 마이크 수집 일시 정지
- 추가 입력은 명확한 안내 후 진행
- 음성 주문 종료 버튼 제공

짧은 침묵만으로 주문을 확정하지 않는다.

느린 발화 및 중간 침묵을 고려한다.

상시 녹음을 기본값으로 사용하지 않는다.

## 12.5 Voice State Machine

```text
Idle
  ↓
Listening
  ↓
Processing
  ├─ Error → Retry / Touch
  ├─ Ambiguous → Candidate Selection
  ├─ Missing Information → Awaiting Input
  └─ Valid Intent → UI Response
                         ↓
                    Confirmation
                         ↓
                    Cart Updated
                         ↓
                    Continue / End
```

Ended 상태에서는 마이크가 비활성화된다.

## 12.6 Voice State UI

| State | Screen Copy | Action |
|---|---|---|
| Idle | 음성으로 주문하기 | Activate |
| Listening | 듣고 있어요. | 말하기 / 중지 |
| Processing | 말씀하신 내용을 확인하고 있어요. | Wait / Cancel |
| Responding | 요청에 맞는 안내 | 화면 확인 |
| Awaiting Input | 필요한 정보 질문 | 음성 / 터치 |
| Confirming | 이 메뉴가 맞나요? | 확인 / 수정 |
| Success | 장바구니에 담았어요. | 추가 주문 |
| Error | 잘 듣지 못했어요. | 재시도 / 터치 |
| Ended | 이제 화면을 눌러 진행해 주세요. | 직접 조작 |

## 12.7 Intent Mapping

| Utterance | Intent | UI Action |
|---|---|---|
| 메뉴 추천해 줘 | navigate_recommend | 추천메뉴 |
| 새로 나온 메뉴 있어? | navigate_new | 신메뉴 |
| 디카페인 보여줘 | navigate_decaf | 디카페인 |
| 커피 보여줘 | navigate_category | 커피 |
| 먹을 것도 보여줘 | navigate_category | 푸드 |
| 달달한 음료 추천해 줘 | recommend_by_preference | 조건별 상품 목록 |
| 3천 원 이하 커피 보여줘 | filter_price | 가격 조건 목록 |
| 아메리카노 주세요 | select_product | 상품 옵션 |
| 아이스 아메리카노 두 잔 | select_product | 상품 확인 |
| 따뜻하게 주세요 | set_temperature | HOT 선택 |
| 두 잔 주세요 | set_quantity | 수량 변경 |
| 샷 하나 추가해 줘 | set_option | 옵션 변경 |
| 이거 무슨 맛이야? | ask_product_detail | 상품 상세 |
| 이걸로 담아줘 | confirm_item | 상품 확정 |
| 하나 더 주문할게 | continue_order | 메뉴 탐색 |
| 이제 됐어 | finish_selection | 최종 주문 확인 |
| 결제해 줘 | unsupported_payment | 직접 결제 안내 |

## 12.8 Conversation Design

### Scenario A. 일반 추천

Customer:  
메뉴 추천해 줘.

AI:  
추천 메뉴를 보여드릴게요.

Screen:  
추천메뉴 카테고리.

Next:  
원하는 메뉴를 말하거나 화면에서 선택해 주세요.

### Scenario B. 특정 카테고리

Customer:  
디카페인 있어?

AI:  
디카페인 메뉴를 보여드릴게요.

Screen:  
디카페인 카테고리.

### Scenario C. 구체적인 상품 주문

Customer:  
아이스 아메리카노 두 잔 주세요.

AI:  
이렇게 담아드릴까요?

Screen:

- 아메리카노
- ICE
- 2잔
- 실제 주문 금액
- 수정
- 장바구니에 담기

### Scenario D. 필수 정보 부족

Customer:  
카페라떼 주세요.

AI:  
따뜻하게 드릴까요, 차갑게 드릴까요?

Screen:

- HOT / 따뜻하게
- ICE / 차갑게

Customer:  
차갑게.

AI:  
선택한 메뉴를 확인해 주세요.

Screen:  
상품 및 옵션 확인.

### Scenario E. 취향 기반 추천

Customer:  
달달한 음료 추천해 줘.

AI:  
달콤한 음료를 찾아봤어요.

Screen:  
실제 메뉴 데이터 기반 추천 결과.

### Scenario F. 인식 실패

AI:  
잘 듣지 못했어요.

Screen:

- 다시 말하기
- 화면에서 선택하기

기존 화면 및 장바구니 유지.

### Scenario G. 음성 주문 종료

Customer:  
이제 됐어.

AI:  
주문 내역을 확인해 주세요.

Screen:  
최종 주문 확인.

마이크 종료.

할인, 적립 및 결제는 직접 선택하도록 안내한다.

## 12.9 Conversation Rules

- 한 번에 하나의 주요 질문
- 이미 입력된 정보 반복 질문 금지
- 부족한 필수 정보만 질문
- 불필요한 인사 및 대화 최소화
- 선택 옵션의 반복 권유 금지
- 모호한 요청은 후보 제공
- 잘못된 인식 결과 수정 가능
- 모든 AI 응답을 화면에 표시
- 사용자가 선택하지 않은 상품 자동 확정 금지
- AI가 실제 메뉴에 없는 정보를 생성하지 않음

## 12.10 Audio Output Policy

- 화면 안내가 기본
- 음성 안내는 선택적
- 다시 듣기 지원
- 음량 조절 지원
- 음성 속도 조절 지원
- 음성 안내 중 마이크 오인식 방지
- 음성 출력이 없어도 주문 가능

## 12.11 Voice Boundary

Allowed:

- 메뉴 탐색
- 상품 추천
- 상품 상세
- 상품 선택
- 온도 및 수량 선택
- 옵션 구성
- 상품 확인 및 장바구니 담기

Not Allowed:

- 최종 주문 확정
- 할인 및 쿠폰 실행
- 포인트 적립 실행
- 전화번호 입력
- 결제 수단 확정
- 결제 승인
- 결제 취소

결제 관련 발화가 들어오면  
직접 조작해야 한다는 안내를 제공한다.

---

# 13. Payment & Business Requirements

## 13.1 Business Principle

기존 기능의 가치를 유지하면서  
고객이 정보를 더 쉽게 이해하도록 개선한다.

## 13.2 Advertisement

- 첫 화면 상단 AD 유지
- 신메뉴 및 시즌 메뉴 노출
- 콜라보 상품 홍보
- 주문 버튼의 위치 고정
- 광고 시청 강제 금지
- 주문 과정 방해 금지

## 13.3 Menu Merchandising

신메뉴 및 콜라보 상품의 탐색 경로:

- 첫 화면 AD
- 신메뉴 카테고리
- 일반 상품군의 NEW 배지
- 추천메뉴
- 관련 상품 추천

일반적인 음성 추천 요청은  
기존 추천메뉴 카테고리로 연결한다.

취향 기반 추천은 고객이 요청한 조건을 우선한다.

프로모션 상품을 이유 없이 우선 추천하지 않는다.

## 13.4 Benefits Group

기존 화면에서 확인한 제휴 혜택 예시:

- KT 멤버십
- T멤버십
- CJ ONE
- 기아멤버스
- SKT 우주패스
- 메가쿠폰

현대 M포인트는 실제 사용 정책에 따라  
혜택 또는 결제 그룹에 배치한다.

## 13.5 Card Payment

- 신용·체크카드
- 삼성페이

## 13.6 Mobile Payment

- 앱카드 QR / 바코드
- 카카오페이
- PAYCO
- 네이버페이
- 제로페이
- BC 페이북
- 하나Pay
- KB Pay
- 신한 SOL Pay / SuperSOL
- 당근페이
- Alipay / WeChat Pay

## 13.7 Gift & Prepaid

- 모바일 상품권
- 메가커피 선불카드
- CJ 기프트카드

## 13.8 Stamp Rewards

메가커피 스탬프 적립 기능을 제공한다.

적립 가능 시점 및 적용 순서는  
실제 운영 정책에 따라 확정한다.

## 13.9 Visibility Policy

기존 화면에서 확인한 할인 및 결제 선택지  
총 22개 타일을 기준으로 재구성한다.

카테고리 내부에 모든 브랜드를 숨기는 방식은 지양한다.

- 브랜드 로고 유지
- 브랜드명 유지
- 목적별 시각적 그룹화
- 직접 선택 가능
- 불필요한 추가 탐색 단계 최소화

실제 지원 브랜드와 정책 변경 여부는  
현장 확인 후 최종 반영한다.

## 13.10 Payment UX Copy

혜택:

"받을 수 있는 혜택이 있나요?"

"해당되는 혜택이 없다면 아래에서 결제 방법을 선택해 주세요."

결제:

"어떻게 결제하시겠어요?"

스탬프:

"메가커피 스탬프를 적립하시겠어요?"

결제 안내:

"화면의 안내에 따라 결제해 주세요."

---

# 14. Session & Timeout Policy

## 14.1 Purpose

기존 시간 관리 기능의 운영 목적에 대한 가설:

- 방치된 키오스크 세션 정리
- 다음 고객의 이용 지원
- 이전 고객의 주문 정보 보호
- 직원의 수동 초기화 부담 감소
- 매장 운영 효율 유지

실제 운영진의 도입 이유는 확인되지 않았다.

## 14.2 Normal State

시간 표시를 낮은 시각적 위계로 제공한다.

일반 상태에서 빨간색 카운트다운을 강조하지 않는다.

미사용 기준과 주문 전체 제한 시간을 구분한다.

## 14.3 Warning State

미사용 120초 경과 시 종료 안내를 표시한다.

60초의 유예 시간을 제공한다.

실제 남은 시간을 표시한다.

계속 주문하기 선택 시 기존 주문을 유지하고  
미사용 타이머를 초기화한다.

## 14.4 Reset State

유예 시간 내 응답이 없는 경우  
미결제 주문 세션을 초기화한다.

초기화 대상:

- 장바구니
- 상품 옵션
- 주문 유형
- 적용 전 혜택 정보
- 사용자별 설정
- 입력된 개인정보
- 음성 임시 데이터

## 14.5 Timer Exceptions

- 음성 입력 중
- 음성 처리 중
- 시스템 응답 대기 중
- 결제 처리 중
- 결제 상태 확인 중

음성 및 시스템 처리 상태에는  
별도의 제한 시간과 오류 복구 정책을 적용한다.

결제 상태가 불명확한 경우  
일반 미사용 초기화를 적용하지 않는다.

## 14.6 Accessibility Time

- 충분한 상품 정보 읽기 시간
- 접근성 이용 시 추가 시간 제공
- 명확한 시간 연장 버튼
- 종료 전 시각적 안내
- 음성 안내 없이 연장 가능

---

# 15. Technical Architecture

## 15.1 System Overview

```text
Touch Input ────────────────────────┐
                                    │
Voice Input                         │
    ↓                               │
Speech-to-Text API                  │
    ↓                               │
AI Intent Analysis                  │
    ↓                               │
Intent Validation                   │
    ↓                               │
UI Action Controller ───────────────┤
                                    ↓
                            Shared Order State
                                    ↓
                              Kiosk UI System
                                    ↓
                         Customer-controlled Payment
```

## 15.2 Architecture Principles

- AI는 자연어 의도를 분석한다.
- AI가 임의의 화면을 생성하지 않는다.
- UI Controller가 기존 화면을 호출한다.
- Menu API가 상품 정보를 제공한다.
- 주문 시스템이 가격을 계산한다.
- 터치와 음성은 동일한 주문 상태를 공유한다.
- 결제 기능은 AI 실행 범위에서 제외한다.

## 15.3 Prototype Modules

### Frontend

- Kiosk UI
- Design System Components
- Global Navigation
- Product Grid
- Product Configuration
- Voice Guidance
- Shared Cart
- Payment UI
- Session Manager

### API Layer

- Mock Menu API
- Speech-to-Text API 또는 모의 입력
- AI Intent API
- Recommendation Filter
- Mock Benefit API
- Mock Payment API

### State Layer

- Session State
- Navigation State
- Voice State
- Product Configuration State
- Cart State
- Benefit State
- Payment State
- Order State

---

# 16. Data Requirements

## 16.1 Category Data

```json
{
  "id": "decaf",
  "name": "디카페인",
  "display_order": 4,
  "active": true,
  "subcategories": []
}
```

## 16.2 Product Data

```json
{
  "id": "product_001",
  "name": "아메리카노",
  "category_ids": [
    "coffee",
    "recommended"
  ],
  "description": "검증된 상품 설명",
  "image_url": null,
  "available": true,
  "temperatures": [
    "HOT",
    "ICE"
  ],
  "prices": {
    "HOT": 1500,
    "ICE": 2000
  },
  "taste_attributes": [],
  "caffeine_type": "regular",
  "tags": [],
  "options": []
}
```

상품명, 가격 및 속성은  
데이터 구조 설명을 위한 예시이다.

## 16.3 Option Data

```json
{
  "id": "option_shot",
  "name": "샷 추가",
  "required": false,
  "selection_type": "quantity",
  "min": 0,
  "max": 3,
  "additional_price": 500,
  "available": true
}
```

## 16.4 Voice Intent Data

```json
{
  "intent": "navigate_category",
  "category_id": "recommended",
  "requires_confirmation": false
}
```

## 16.5 Product Selection Intent

```json
{
  "intent": "select_product",
  "product_name": "아메리카노",
  "temperature": "ICE",
  "quantity": 2,
  "options": [],
  "requires_confirmation": true
}
```

상품명은 실제 Product ID와 매칭한 후 사용한다.

## 16.6 Recommendation Intent

```json
{
  "intent": "recommend_by_preference",
  "filters": {
    "taste": "sweet",
    "temperature": "ICE",
    "max_price": null,
    "category_ids": []
  }
}
```

## 16.7 Cart Item

```json
{
  "cart_item_id": "cart_001",
  "product_id": "product_001",
  "product_name": "아메리카노",
  "temperature": "ICE",
  "quantity": 2,
  "unit_price": 2000,
  "options": [],
  "total_price": 4000
}
```

## 16.8 Shared Order State

```json
{
  "session_id": "session_001",
  "order_type": "takeout",
  "current_screen": "menu",
  "selected_category": "coffee",
  "input_mode": "touch",
  "voice_active": false,
  "voice_status": "idle",
  "items": [],
  "subtotal": 0,
  "discount_total": 0,
  "total": 0,
  "payment_status": "not_started",
  "order_status": "draft"
}
```

## 16.9 Payment Data

```json
{
  "payment_id": null,
  "method": null,
  "amount": 0,
  "status": "not_started",
  "transaction_reference": null
}
```

## 16.10 Order Data

```json
{
  "order_id": null,
  "order_number": null,
  "status": "draft",
  "payment_status": "not_started",
  "items": [],
  "total": 0
}
```

## 16.11 Data Validation

- Product ID 검증
- 판매 가능 여부 확인
- 온도 선택 가능 여부 확인
- 옵션 유효성 확인
- 수량 범위 검증
- 실제 메뉴 데이터 기준 가격 계산
- 중복 명령 실행 방지
- 유효하지 않은 Intent 차단
- 결제 관련 음성 Intent 차단

---

# 17. API Requirements

모든 엔드포인트는 프로토타입용 제안이다.

실제 메가커피 API 명세가 아니다.

## 17.1 Menu API

`GET /api/categories`

기능:  
메뉴 카테고리 목록 조회.

`GET /api/products`

기능:  
카테고리 및 조건별 상품 목록 조회.

`GET /api/products/:id`

기능:  
상품 상세 및 옵션 조회.

## 17.2 Voice API

`POST /api/voice/transcribe`

기능:  
음성을 텍스트로 변환.

`POST /api/voice/intent`

기능:  
고객 발화의 의도 및 조건 추출.

Input:

```json
{
  "transcript": "메뉴 추천해 줘",
  "current_screen": "menu",
  "selected_category": "coffee"
}
```

Output:

```json
{
  "intent": "navigate_category",
  "category_id": "recommended"
}
```

## 17.3 Recommendation API

`POST /api/recommendations`

기능:  
검증된 메뉴 속성을 기반으로 상품 목록 반환.

## 17.4 Cart API

`POST /api/cart/items`

상품 추가.

`PATCH /api/cart/items/:id`

상품 수량 및 옵션 변경.

`DELETE /api/cart/items/:id`

상품 삭제.

`GET /api/cart`

장바구니 및 총 주문 금액 조회.

프로토타입에서는 로컬 상태로 구현할 수 있다.

## 17.5 Mock Benefit API

`GET /api/benefits`

지원 혜택 목록 조회.

`POST /api/benefits/validate`

모의 혜택 적용 가능 여부 확인.

실제 쿠폰 및 개인정보는 사용하지 않는다.

## 17.6 Mock Payment API

`POST /api/payment/mock`

모의 결제 요청.

`GET /api/payment/:id/status`

모의 결제 상태 확인.

## 17.7 Mock Order API

`POST /api/orders/mock`

모의 주문 접수.

`GET /api/orders/:id`

모의 주문 상태 확인.

## 17.8 AI Guardrails

- 허용된 Intent만 반환
- JSON Schema 검증
- 존재하지 않는 상품 선택 차단
- 가격 및 상품 정보 임의 생성 금지
- 주문 상태 변경 전 유효성 검증
- 확인되지 않은 상품 자동 확정 금지
- 결제 API 접근 금지
- 개인정보 입력 요청 금지
- API 오류 발생 시 터치 주문 유지

---

# 18. State Management

## 18.1 Voice State

- idle
- listening
- processing
- responding
- awaiting_input
- confirming
- success
- error
- ended

## 18.2 Session State

- active
- inactive
- warning
- extended
- reset
- protected

## 18.3 Payment State

- not_started
- pending
- approved
- failed
- unknown

## 18.4 Order State

- draft
- reviewing
- awaiting_payment
- submitting
- submitted
- submission_failed
- completed

## 18.5 State Rules

- 음성 주문 전환 시 Cart State 유지
- 카테고리 이동 시 Cart State 유지
- 음성 API 오류 시 Navigation State 유지
- 상품 확인 전에는 임시 Configuration State 사용
- 최종 주문 확인 진입 시 Voice State 종료
- 결제 처리 중 Cart State 잠금
- 결제 승인 후 주문 접수 상태 확인
- 결제 결과 불명확 시 Session State 보호
- 주문 접수 확인 후 완료 화면 표시

---

# 19. Edge Cases & Error Handling

| Case | System Response | User Action |
|---|---|---|
| 마이크 권한 없음 | 음성 기능 이용 불가 안내 | 터치 주문 |
| 마이크 미탑재 | 음성 기능 비활성화 | 터치 주문 |
| 매장 소음 | 인식 실패 안내 | 다시 말하기 |
| 주변 고객 발화 | 주문 자동 확정 방지 | 직접 확인 |
| 느린 발화 | 충분한 입력 시간 제공 | 계속 말하기 |
| 발화 중 침묵 | 즉시 주문 확정하지 않음 | 입력 계속 |
| 상품명 오인식 | 후보 상품 표시 | 선택 / 수정 |
| 상품명 모호 | 후보 목록 표시 | 상품 선택 |
| 온도 정보 부족 | 필수 질문 표시 | HOT / ICE |
| 수량 정보 부족 | 기본값 표시 및 확인 | 수량 수정 |
| 잘못된 수량 | 주문 내용 확인 | 수정 |
| 옵션 정보 오류 | 유효한 옵션 표시 | 옵션 수정 |
| 상품 품절 | 품절 및 대안 안내 | 다른 상품 |
| 추천 결과 없음 | 조건 불일치 안내 | 조건 변경 |
| 음성 API 실패 | 기존 주문 유지 | 터치 전환 |
| 메뉴 API 실패 | 오류 및 재시도 안내 | 다시 시도 |
| 중복 음성 명령 | 중복 실행 차단 | 주문 확인 |
| 처리 중 화면 변경 | 이전 음성 응답 무효화 | 현재 화면 유지 |
| 주문 시간 초과 예정 | 종료 전 경고 | 시간 연장 |
| 할인 적용 실패 | 실패 이유 안내 | 다른 혜택 |
| 결제 실패 확정 | 결제 실패 안내 | 재시도 / 다른 수단 |
| 결제 상태 불명확 | 결제 확인 중 안내 | 대기 / 도움 요청 |
| 결제 승인 후 접수 실패 | 기존 결제 정보 보호 | 도움 요청 |
| 결제 중 시간 초과 | 세션 보호 | 결과 확인 |
| 고객 주문 취소 | 미결제 세션 종료 확인 | 취소 / 계속 |

## 19.1 Recovery Principle

오류가 발생해도  
가능한 경우 고객이 처음부터 다시 주문하지 않도록 한다.

## 19.2 Voice Request Cancellation

고객이 음성 입력 중 다른 화면으로 이동하거나  
음성 주문을 종료한 경우 진행 중인 요청을 취소한다.

이전 요청의 늦은 응답이  
현재 화면이나 주문 상태를 변경하지 않도록 한다.

## 19.3 Payment Recovery

결제 실패가 확정된 경우에만  
안전한 재결제 행동을 제공한다.

결제 승인 여부가 불명확한 경우:

- 결제 상태 확인
- 중복 결제 방지
- 주문 정보 유지
- 필요한 경우 직원 도움 요청

---

# 20. Non-Functional Requirements

## 20.1 Usability

- 주요 기능의 위치 일관성
- 현재 주문 상태의 명확한 표시
- 필수 및 선택 정보 구분
- 터치와 음성의 자유로운 전환
- 불필요한 화면 이동 최소화

## 20.2 Performance

프로토타입 성능 목표:

- 터치 입력 후 즉시 시각적 피드백
- 메뉴 전환 시 불필요한 로딩 최소화
- 음성 인식 중 상태 표시
- AI 응답 지연 시 처리 상태 표시
- 장시간 응답이 없으면 재시도 제공

실제 API 응답 속도는 측정 후 기록한다.

## 20.3 Reliability

- 주문 상태의 일관성 유지
- 중복 상품 추가 방지
- API 실패 시 터치 주문 유지
- 결제 요청 중복 방지
- 유효하지 않은 상태 전환 방지

## 20.4 Accessibility

- 일반 텍스트 명도 대비 4.5:1 이상 목표
- 큰 텍스트 및 주요 UI 대비 3:1 이상 목표
- 충분한 물리적 터치 영역
- 색상 외 상태 표현
- 화면 중심 음성 안내
- 충분한 조작 시간
- 실제 기기 설치 환경 검증

관련 접근성 기준 충족 여부는  
별도 검증을 통해 확인한다.

## 20.5 Privacy

- 명시적인 음성 활성화
- 마이크 활성화 상태 표시
- 불필요한 상시 녹음 금지
- 원본 음성 및 발화 기록의 불필요한 저장 금지
- 실제 개인정보 수집 금지
- 결제 관련 음성 정보 수집 제한
- 세션 종료 시 임시 데이터 정리
- 외부 음성 API의 데이터 처리 정책 확인

## 20.6 Security

- API Key를 클라이언트 코드에 노출하지 않음
- 서버 측 API 요청 검증
- AI 출력값 검증
- 허용된 UI Action만 실행
- 결제 관련 AI 실행 권한 차단
- 실제 결제 정보 저장 금지

---

# 21. Design Requirements

## 21.1 Design System Reference

UXPRESSO_Kiosk_Design_System_v1.0.md

모든 화면은 해당 디자인 시스템의  
토큰, 컴포넌트 및 인터랙션 규칙을 따른다.

## 21.2 Canvas

- 1080 × 1920px
- Portrait
- 9:16
- 12 Column Grid
- Margin: 40px
- Gutter: 24px

실제 기기 규격 확인 전까지 제안 값으로 사용한다.

## 21.3 Color

- Primary: #FFDC00
- Black: #171717
- White: #FFFFFF
- Secondary Surface: #F5F5F5
- Voice Surface: #FFF7D1
- Secondary Text: #595959
- Border: #D9D9D9

## 21.4 Typography

- Pretendard
- Noto Sans KR fallback
- 주요 정보의 충분한 글자 크기
- 가격 및 CTA 강조
- 읽기 거리 고려

## 21.5 Layout

- 상단 Global Header
- 조건부 Voice Guidance Bar
- 8개 대분류 Category Navigation
- 하위 카테고리 및 필터
- Product Grid
- Session Control
- Sticky Cart
- Accessibility Utilities

상품 카드 3열 및 카테고리 4×2 배치는  
초기 디자인 제안이다.

## 21.6 Component Reuse

터치와 음성 주문은 다음 컴포넌트를 공유한다.

- Category Tab
- Product Card
- Product Detail
- Temperature Selector
- Option Card
- Quantity Stepper
- Cart Item
- Order Summary

음성 전용 신규 컴포넌트:

- Voice Trigger
- Voice Guidance Bar
- Voice Listening State
- Voice Processing State
- Voice Question
- Voice Confirmation
- Voice Error
- Voice-to-Touch Transition

---

# 22. Screen Inventory

## Start

- S01. 첫 화면 / AD
- S02. 매장 식사 / 포장 선택
- S03. 언어 선택
- S04. 접근성 설정

## Menu

- M01. 신메뉴
- M02. 추천메뉴
- M03. 커피
- M04. 디카페인
- M05. 음료
- M06. 티
- M07. 푸드
- M08. 상품
- M09. 상품 상세
- M10. 상품 옵션
- M11. 상품 담기 성공

## Voice

- V01. 음성 주문 활성화
- V02. 음성 입력 중
- V03. 음성 처리 중
- V04. 추천메뉴 이동
- V05. 디카페인 이동
- V06. 취향 기반 추천
- V07. 특정 상품 선택
- V08. 필수 정보 질문
- V09. 상품 확인
- V10. 인식 실패
- V11. 후보 상품 선택
- V12. 터치 전환
- V13. 음성 주문 종료

## Cart

- C01. 장바구니
- C02. 상품 수정
- C03. 최종 주문 확인

## Payment

- P01. 혜택 및 결제 방법
- P02. 제휴 혜택 적용
- P03. 쿠폰 적용
- P04. 스탬프 적립
- P05. 카드 결제 안내
- P06. 모바일 결제 안내
- P07. 결제 처리 중
- P08. 결제 실패
- P09. 결제 상태 확인
- P10. 주문 접수 확인
- P11. 주문 완료

## Session

- T01. 일반 시간 안내
- T02. 시간 연장
- T03. 종료 전 안내
- T04. 세션 초기화

모든 상태를 별도의 독립 화면으로 제작할 필요는 없다.

공통 컴포넌트 Variant와 Overlay를 활용한다.

---

# 23. Success Metrics

## 23.1 North Star Metric

Independent Order Completion Rate

직원이나 주변 고객의 도움 없이  
정확한 주문을 완료한 비율.

Calculation:

독립적으로 정확한 주문을 완료한 참여자 수  
÷ 전체 주문 시도 참여자 수 × 100

키오스크 자체의 음성 기능 및 도움말 이용은  
독립적 주문에 포함한다.

프로토타입에서는 모의 결제 및 주문 완료를 기준으로 측정한다.

## 23.2 Menu Metrics

- 메뉴 탐색 성공률
- 첫 카테고리 선택 정확도
- 카테고리 변경 횟수
- 상품 선택 오류 횟수
- 메뉴 탐색 소요 시간

## 23.3 Voice Metrics

- 음성 기능 발견율
- 음성 주문 활성화 성공률
- 음성 의도 인식 성공률
- 올바른 UI 연결 비율
- 필수 정보 추출 정확도
- 음성 인식 실패 복구율
- 음성 / 터치 전환 성공률
- 음성 안내 없이 주문 완료한 비율

## 23.4 Payment Metrics

- 혜택 발견율
- 결제 수단 탐색 성공률
- 적립 기능 발견율
- 결제 단계 전환 이해도
- 모의 결제 완료율

## 23.5 Session Metrics

- 시간 안내 이해도
- 시간 연장 성공률
- 종료 경고 인지 여부
- 의도하지 않은 주문 초기화 발생 횟수

## 23.6 Experience Metrics

- 주문 자신감
- 주관적 인지 부담
- 주문 만족도
- 타인 도움 요청 횟수
- 주문 정확도
- 전체 주문 소요 시간

주문 소요 시간은 보조 지표이다.

느리더라도 독립적으로 정확하게 주문할 수 있다면  
프로젝트의 핵심 목적에 부합한다.

## 23.7 Success Criteria

검증 전에는 실제 개선율을 확정하지 않는다.

AS-IS 대비 TO-BE에서 다음 방향을 기대한다.

- 독립적 주문 완료 증가
- 상품 및 옵션 선택 오류 감소
- 도움 요청 감소
- 오류 복구 가능성 향상
- 주문 자신감 향상
- 혜택 발견 가능성 유지
- 주문 상태 유지

모든 결과는 실제 테스트 이후 기록한다.

---

# 24. Analytics Event Plan

프로토타입 사용자 테스트를 위한 이벤트 설계.

| Event | Description |
|---|---|
| session_started | 주문 시작 |
| order_type_selected | 매장 / 포장 선택 |
| category_selected | 카테고리 선택 |
| product_viewed | 상품 확인 |
| product_selected | 상품 선택 |
| option_changed | 옵션 변경 |
| voice_activated | 음성 주문 시작 |
| voice_deactivated | 음성 주문 종료 |
| voice_intent_resolved | 의도 분석 성공 |
| voice_intent_failed | 의도 분석 실패 |
| voice_ui_navigated | 음성 기반 화면 이동 |
| voice_retry | 음성 재시도 |
| touch_fallback | 터치 주문 전환 |
| cart_item_added | 상품 추가 |
| cart_item_edited | 상품 수정 |
| cart_item_removed | 상품 삭제 |
| order_review_opened | 최종 주문 확인 |
| benefit_selected | 혜택 선택 |
| payment_method_selected | 결제 방법 선택 |
| mock_payment_completed | 모의 결제 완료 |
| timeout_warning_shown | 종료 안내 표시 |
| session_extended | 시간 연장 |
| session_reset | 세션 초기화 |
| order_completed | 주문 완료 |

## 24.1 Event Properties

- Anonymous Session ID
- Timestamp
- Screen ID
- Input Mode
- Category ID
- Product ID
- Intent Type
- Result Status
- Error Type
- Duration

원본 음성, 전화번호 및 실제 결제 정보는  
분석 이벤트에 포함하지 않는다.

---

# 25. Usability Testing Plan

## 25.1 Research Objective

개선된 키오스크가 디지털 숙련도가 낮은 고객의  
독립적인 주문을 실제로 지원하는지 검증한다.

## 25.2 Research Questions

- 기존 카테고리 구조를 이해하지 않아도 메뉴를 찾을 수 있는가?
- 음성 주문 기능을 스스로 발견할 수 있는가?
- AI의 화면 안내를 이해할 수 있는가?
- AI 음성을 듣지 않아도 주문할 수 있는가?
- 음성과 터치 사이를 자연스럽게 전환할 수 있는가?
- 잘못된 음성 인식을 스스로 수정할 수 있는가?
- 최종 주문 확인부터 직접 조작해야 함을 이해하는가?
- 할인 및 결제 브랜드를 발견할 수 있는가?
- 시간 종료 안내를 이해하고 연장할 수 있는가?

## 25.3 Participants

초기 탐색적 UT 제안:

- 디지털 숙련도가 낮은 사용자 4명
- 일반 키오스크 사용자 2명

가능한 경우:

- 고령 사용자
- 청력 저하 사용자
- 터치 조작에 어려움이 있는 사용자

실제 대상 사용자 모집이 어려운 경우  
대체 참여자의 특성과 한계를 명시한다.

## 25.4 Test Method

- AS-IS / TO-BE 비교
- 동일하거나 난이도가 유사한 과제
- Think Aloud
- 행동 관찰
- 오류 및 도움 요청 기록
- 과제 후 인터뷰
- 주문 자신감 및 부담도 평가

가능한 경우 테스트 순서를 교차 배치한다.

음성 기능 발견율을 측정하는 과제에서는  
음성 주문 사용법을 사전에 설명하지 않는다.

## 25.5 Core Tasks

### Task 01. 목적형 메뉴 탐색

디카페인 아이스 아메리카노 한 잔을 주문한다.

Measure:

- 첫 카테고리 선택
- 탐색 성공 여부
- 도움 요청
- 주문 정확도

### Task 02. 음성 주문 발견

화면에서 메뉴를 찾기 어려운 상황에서  
다른 주문 방법을 찾아 이용한다.

Measure:

- 음성 기능 발견 여부
- 활성화 성공 여부

### Task 03. 일반 메뉴 추천

추천받은 메뉴 중 원하는 상품을 주문한다.

Measure:

- 추천메뉴 이동 성공
- 다음 행동 이해

### Task 04. 자연어 주문

아이스 아메리카노 두 잔을 주문한다.

Measure:

- 상품 인식
- 온도 인식
- 수량 인식
- 주문 확인 성공

### Task 05. 필수 정보 질문

상품명만 말한 뒤 필요한 옵션을 선택한다.

Measure:

- 질문 이해
- 음성 또는 터치 응답 성공

### Task 06. 음성 안내 없이 주문

AI 음성 출력을 끈 상태에서  
화면 안내만으로 주문한다.

Measure:

- 화면 안내 이해
- 다음 행동 선택
- 주문 완료 여부

### Task 07. 인식 오류 복구

상품 또는 수량이 잘못 인식된 상황을 수정한다.

Measure:

- 오류 인지
- 수정 성공
- 기존 주문 유지

### Task 08. 입력 방식 전환

터치 주문 중 음성으로 전환하고  
다시 터치 주문을 이어간다.

Measure:

- 전환 성공
- 주문 상태 유지

### Task 09. 혜택 및 결제

이용 가능한 제휴 혜택을 확인하고  
원하는 결제 수단으로 모의 결제를 진행한다.

Measure:

- 혜택 발견
- 결제 수단 발견
- 직접 결제 전환 이해

### Task 10. 시간 연장

종료 안내가 나타났을 때  
기존 주문을 유지하면서 주문을 계속한다.

Measure:

- 경고 인지
- 시간 연장 성공
- 주문 상태 유지

## 25.6 Priority Testing

2일 프로젝트에서는 다음 과제를 우선한다.

- 목적형 메뉴 탐색
- 음성 기능 발견
- 자연어 주문
- 음성 안내 없이 주문
- 오류 복구
- 직접 결제 전환

## 25.7 Interview Questions

- 주문 중 가장 어려웠던 부분은 무엇인가요?
- 다음에 무엇을 해야 할지 헷갈린 순간이 있었나요?
- 음성으로 주문하는 방식이 편했나요?
- AI가 말하지 않아도 화면을 이해할 수 있었나요?
- 주문 내용이 정확하다고 확신했나요?
- 결제 단계에서 직접 화면을 눌러야 한다는 점을 이해했나요?
- 시간에 쫓긴다는 느낌이 있었나요?
- 다음에도 혼자 주문할 수 있을 것 같나요?

## 25.8 Test Result Template

| Participant | Task | Success | Help | Error | Time | Observation |
|---|---|---|---|---|---|---|
| P01 | T01 | TBD | TBD | TBD | TBD | TBD |
| P02 | T01 | TBD | TBD | TBD | TBD | TBD |

## 25.9 Result Interpretation

소규모 사용자 테스트 결과를  
전체 고객에게 일반화하지 않는다.

정량 결과와 함께 다음 내용을 기록한다.

- 실제 행동
- 참여자 발화
- 문제 발생 화면
- 오류 발생 원인
- 개선 이후 변화
- 남은 문제

실제 측정하지 않은 수치는 생성하지 않는다.

---

# 26. Risks & Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| 매장 소음 | 음성 인식 실패 | 터치 대체 및 재시도 |
| 느린 발화 | 입력 조기 종료 | 충분한 입력 시간 |
| 청력 저하 | AI 안내 이해 어려움 | 모든 안내 화면 표시 |
| 잘못된 음성 인식 | 주문 오류 | 상품 확정 전 확인 |
| AI 환각 | 잘못된 상품 정보 | 메뉴 데이터 검증 |
| 상단 버튼 접근 어려움 | 음성 기능 사용 제한 | 물리적 접근성 검증 |
| 상품 수 증가 | 탐색 부담 | 하위 IA 및 필터 |
| 브랜드 과도한 축소 | 혜택 발견 감소 | 기존 브랜드 가시성 유지 |
| 타이머 오해 | 시간 압박 | 미사용 기준 명확화 |
| API 응답 지연 | 주문 중단 | 상태 표시 및 터치 전환 |
| 결제 상태 불명확 | 중복 결제 | 재결제 제한 및 상태 확인 |
| 실제 기기 미확인 | 구현 제약 | 기기 사양 검증 |
| 내부 정책 미확인 | 운영 요구 불일치 | 제안과 확인 사항 구분 |
| 2일 일정 | 구현 범위 과다 | P0 중심 프로토타입 |
| 사용자 모집 부족 | 검증 한계 | 탐색적 테스트 및 한계 명시 |

---

# 27. Development Plan

## 27.1 DAY 1 — Core UX/UI

### Phase 01. Requirement Freeze

- 문제 정의 확정
- PRD 확정
- MVP 범위 확정
- 기존 화면 구조 정리

### Phase 02. Design Foundation

- 컬러 토큰
- 타이포그래피
- 레이아웃
- 공통 버튼
- 상품 카드
- 카테고리
- Global Header
- Sticky Cart

### Phase 03. Main Screen Design

- 첫 화면
- 메뉴 탐색
- 상품 상세
- 옵션 선택
- 장바구니

### Phase 04. Voice Design

- Voice Trigger
- Voice Guidance Bar
- Listening State
- Processing State
- Confirmation State
- Error State

## 27.2 DAY 2 — Prototype & Validation

### Phase 05. Voice Prototype

- 음성 입력 또는 모의 입력
- AI Intent Analysis
- 추천메뉴 이동
- 디카페인 이동
- 상품 선택
- 온도 및 수량 추출
- 공통 장바구니 연동

### Phase 06. Payment & Session

- 주문 확인
- 음성 종료
- 할인 및 결제 그룹
- 모의 결제
- 주문 완료
- 시간 종료 안내

### Phase 07. QA

- 주요 사용자 흐름 검증
- 음성 / 터치 상태 유지
- 오류 복구
- 주문 금액 계산
- 결제 실행 범위 검증

### Phase 08. Usability Testing

- 핵심 과제 수행
- 사용자 행동 기록
- 문제점 도출
- 가능한 범위에서 개선
- 결과 및 한계 정리

2일 내 전체 기능 구현과 6명 UT를  
모두 완료할 수 있다고 가정하지 않는다.

시간이 부족한 경우 핵심 음성 주문 흐름과  
모의 결제 연결을 우선 완성한다.

---

# 28. Definition of Done

## 28.1 Design Done

- [ ] 핵심 화면 디자인 완료
- [ ] 공통 디자인 토큰 정의
- [ ] 주요 컴포넌트 제작
- [ ] 8개 카테고리 직접 접근
- [ ] 음성 주문 상태 디자인
- [ ] 오류 및 복구 상태 디자인
- [ ] 결제 브랜드 그룹화
- [ ] 시간 종료 안내 디자인

## 28.2 Prototype Done

- [ ] 첫 화면에서 주문 시작 가능
- [ ] 터치 주문 완료 가능
- [ ] 음성 또는 모의 음성 입력 가능
- [ ] 일반 추천 요청 시 추천메뉴 이동
- [ ] 디카페인 요청 시 디카페인 이동
- [ ] 특정 상품 요청 시 상품 선택 가능
- [ ] 온도 및 수량 확인 가능
- [ ] 장바구니 담기 가능
- [ ] 입력 방식 전환 시 주문 유지
- [ ] 음성 인식 실패 복구 가능
- [ ] 주문 확인 시 마이크 종료
- [ ] 직접 모의 결제 가능
- [ ] 주문 완료 화면 표시
- [ ] 시간 연장 가능

## 28.3 Validation Done

- [ ] 핵심 사용자 과제 정의
- [ ] 실제 참여자 테스트 수행
- [ ] 성공 및 실패 사례 기록
- [ ] 음성 안내 없는 주문 검증
- [ ] 주문 상태 유지 검증
- [ ] 정성적 사용자 피드백 기록
- [ ] 테스트 한계 명시
- [ ] 후속 개선점 정리

검증하지 않은 항목은 완료로 표시하지 않는다.

---

# 29. Deliverables

## 29.1 Planning

- UXPRESSO_Kiosk_PRD_v3.0.md
- Problem Definition
- AS-IS / TO-BE Analysis
- Information Architecture
- User Flow
- Functional Requirements

## 29.2 Design

- UXPRESSO_Kiosk_Design_System_v1.0.md
- Figma Foundations
- Component Library
- Main Screens
- Voice UX Patterns
- Payment UI
- Session UI
- Error Recovery UI

## 29.3 Prototype

- Interactive Kiosk Prototype
- Touch Order Flow
- Voice-driven Order Flow
- Mock Menu API
- Intent Analysis Demo
- Shared Cart
- Mock Payment
- Order Completion

## 29.4 Research

- UT Scenario
- Observation Sheet
- Test Results
- User Feedback
- Iteration Log
- Project Limitations

## 29.5 Portfolio

- 프로젝트 배경
- 문제 정의
- 기존 화면 분석
- 핵심 사용자 가설
- 디자인 전략
- 정보구조 개선
- 음성 주문 인터랙션
- 비즈니스 요구사항 반영
- 접근성 개선
- API 기반 프로토타입
- 사용자 검증
- 개선 결과 및 한계

---

# 30. Open Questions

## Brand & Menu

- 실제 브랜드 컬러 가이드는 무엇인가?
- 기존 메가메뉴의 운영상 의미는 무엇인가?
- 실제 판매 상품의 전체 분류는 어떻게 구성되는가?
- 추천 및 인기 메뉴는 어떤 기준으로 선정되는가?
- 신메뉴 및 콜라보 상품의 노출 정책은 무엇인가?

## Hardware

- 실제 키오스크 해상도와 물리적 크기는?
- 마이크와 스피커가 탑재되어 있는가?
- 매장 소음 수준은 어느 정도인가?
- 주요 버튼의 실제 도달 가능 범위는?
- 결제 단말기 위치 및 지원 방식은?

## Payment

- 실제 할인 및 적립 적용 순서는?
- 현대 M포인트는 어떤 방식으로 사용되는가?
- 스탬프 적립은 언제 진행되는가?
- 제휴 혜택의 중복 적용이 가능한가?
- 결제 승인 후 주문 접수 실패 시 운영 정책은?

## Session

- 기존 타이머는 전체 주문 시간인가, 미사용 시간인가?
- 화면 조작 시 타이머가 초기화되는가?
- 종료 전 경고가 제공되는가?
- 기존 접근성 모드에서 시간이 연장되는가?
- 결제 처리 중 타이머가 어떻게 동작하는가?

## Voice

- 실제 매장에서 음성 인식이 충분히 정확한가?
- 느린 발화 및 중간 침묵을 어떻게 처리할 것인가?
- 고객이 상단 음성 버튼을 발견할 수 있는가?
- 화면 중심 안내가 실제 고령 사용자에게 충분한가?
- 음성 안내의 기본 설정은 무엇이 적합한가?
- 외부 음성 API의 데이터 보관 정책은 무엇인가?

---

# 31. Final Product Statement

UXPRESSO는 기존 키오스크를 단순하게 만들기 위해  
기능을 제거하는 프로젝트가 아니다.

기존 메가커피의 브랜드 경험과  
비즈니스 및 운영 가치를 유지하면서  
고객의 탐색과 선택 과정에서 발생하는 어려움을 개선한다.

음성 기술은 터치 주문을 대체하지 않는다.

고객이 원하는 메뉴를 말하면  
기존 키오스크의 적절한 화면으로 연결하고,  
필요한 순간에는 직접 선택하고 수정할 수 있도록 한다.

모든 AI 안내는 화면에 표시하며  
고객이 AI 음성을 듣지 못해도 주문할 수 있도록 한다.

메뉴 선택까지는 음성으로 지원하지만  
최종 주문 확인, 할인, 적립 및 결제는  
고객이 직접 진행한다.

이를 통해 디지털 숙련도와 관계없이  
고객이 자신에게 익숙한 방식으로  
독립적이고 정확한 주문을 완료할 수 있는  
키오스크 경험을 제공하고자 한다.

---

Familiar Brand, Accessible Experience.

Reduce Decisions, Not Features.

Reduce Complexity, Not Visibility.

One Flow, Multiple Ways.

Speak to Select, Touch to Confirm.

Control, Not Pressure.

누구나 쉽게, 혼자서도 자신 있게.

---

Document: Product Requirements Document  
Project: UXPRESSO  
Version: 3.0  
Status: Proposed / Pre-validation
