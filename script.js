// 센터 방문 개통 요청서 애플리케이션
class CenterVisitApp {
    constructor() {
        this.sellers = this.loadSellers();
        this.currentZoom = 1;
        this.minZoom = 0.3;
        this.maxZoom = 2.5;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSavedData();
        this.setupFormValidation();
        this.updateSellerDropdown();
    }

    bindEvents() {
        document.getElementById('profileBtn').addEventListener('click', () => this.openModal('profileModal'));
        document.getElementById('previewBtn').addEventListener('click', () => this.openPreview());
        
        // 닫기 버튼 이벤트 처리 개선 (모바일 지원)
        document.querySelectorAll('.close').forEach(closeBtn => {
            // 클릭 이벤트
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const modal = e.target.closest('.modal');
                this.closeModal(modal);
            });
            
            // 터치 이벤트 추가 (모바일 지원)
            closeBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const modal = e.target.closest('.modal');
                this.closeModal(modal);
            });
        });

        // 모달 배경 클릭 시 닫기
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });

        document.getElementById('saveProfile').addEventListener('click', () => this.saveProfile());
        document.getElementById('loadProfile').addEventListener('click', () => this.loadProfile());
        document.getElementById('deleteSeller').addEventListener('click', () => this.deleteSeller());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadImage());

        // 매출자 선택 드롭다운 (프로필 모달)
        document.getElementById('sellerSelect').addEventListener('change', (e) => this.selectSeller(e.target.value));
        
        // 매출자 선택 드롭다운 (메인 화면)
        document.getElementById('mainSellerSelect').addEventListener('change', (e) => this.selectMainSeller(e.target.value));

        // 줌 컨트롤 버튼들
        document.getElementById('zoomIn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOut').addEventListener('click', () => this.zoomOut());
        document.getElementById('resetZoom').addEventListener('click', () => this.resetZoom());

        // ESC 키로 모달 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal[style*="display: block"]');
                if (openModal) {
                    this.closeModal(openModal);
                }
            }
        });

        this.setupCheckboxGroups();
        this.setupRealTimeUpdate();
    }

    setupCheckboxGroups() {
        const contractTypeCheckboxes = document.querySelectorAll('input[name="contractType"]');
        const paymentTypeCheckboxes = document.querySelectorAll('input[name="paymentType"]');

        contractTypeCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    contractTypeCheckboxes.forEach(other => {
                        if (other !== checkbox) other.checked = false;
                    });
                }
            });
        });

        paymentTypeCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    paymentTypeCheckboxes.forEach(other => {
                        if (other !== checkbox) other.checked = false;
                    });
                }
            });
        });
    }

    setupRealTimeUpdate() {
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.saveTempData();
            });
            input.addEventListener('change', () => {
                this.saveTempData();
            });
        });
    }

    setupFormValidation() {
        const phoneInputs = document.querySelectorAll('input[type="tel"]');
        phoneInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9\-\s]/g, '');
            });
        });

        const birthInput = document.getElementById('ownerBirth');
        if (birthInput) {
            birthInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
                if (e.target.value.length > 8) {
                    e.target.value = e.target.value.slice(0, 8);
                }
            });
        }
    }

    // 메인 화면 매출자 선택 기능
    selectMainSeller(index) {
        if (index === '') return;
        
        const sellers = this.loadSellers();
        if (sellers[index]) {
            const seller = sellers[index];
            // 폼 데이터에 매출자 정보 설정
            const storeIdElement = document.getElementById('storeId');
            const storeNameElement = document.getElementById('storeName');
            
            if (storeIdElement) storeIdElement.value = seller.storeId;
            if (storeNameElement) storeNameElement.value = seller.storeName;
            
            this.saveTempData();
            this.showToast('매출자 정보가 적용되었습니다.', 'success');
        }
    }

    // 기존 메서드를 사용하지 않지만 호환성을 위해 빈 함수로 유지
    toggleNumberPortingFields(show) {
        // 번호이동 필드가 항상 표시되므로 이 메서드는 비활성화
    }

    // 줌 기능들
    zoomIn() {
        if (this.currentZoom < this.maxZoom) {
            this.currentZoom += 0.1;
            this.applyZoom();
        }
    }

    zoomOut() {
        if (this.currentZoom > this.minZoom) {
            this.currentZoom -= 0.1;
            this.applyZoom();
        }
    }

    resetZoom() {
        // 모바일 기본 크기로 리셋 (가독성 개선)
        if (window.innerWidth <= 480) {
            this.currentZoom = 0.6;  // 더 크게 조정
        } else if (window.innerWidth <= 768) {
            this.currentZoom = 0.7;  // 더 크게 조정
        } else {
            this.currentZoom = 1;
        }
        this.applyZoom();
    }

    applyZoom() {
        const previewContent = document.getElementById('previewContent');
        if (previewContent) {
            // 현재 줌 레벨을 직접 적용 (더 단순하고 명확한 방식)
            previewContent.style.transform = `scale(${this.currentZoom})`;
            previewContent.style.transformOrigin = 'center top';
        }
    }

    setupTouchGestures() {
        const previewContainer = document.querySelector('.preview-container');
        const previewContent = document.getElementById('previewContent');
        
        if (!previewContainer || !previewContent) return;

        let lastTouchDistance = 0;
        let lastTapTime = 0;

        // 핀치 줌 지원
        previewContainer.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                lastTouchDistance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );
            }
        });

        previewContainer.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const currentDistance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );

                if (lastTouchDistance > 0) {
                    const ratio = currentDistance / lastTouchDistance;
                    const newZoom = this.currentZoom * ratio;
                    
                    if (newZoom >= this.minZoom && newZoom <= this.maxZoom) {
                        this.currentZoom = newZoom;
                        this.applyZoom();
                    }
                }
                lastTouchDistance = currentDistance;
            }
        });

        // 더블탭 줌
        previewContainer.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTapTime;
            
            if (tapLength < 500 && tapLength > 0) {
                // 더블탭 감지됨
                if (this.currentZoom > 1) {
                    this.resetZoom();
                } else {
                    this.currentZoom = 1.5;
                    this.applyZoom();
                }
            }
            lastTapTime = currentTime;
        });

        // 스크롤 휠 줌 (데스크톱)
        previewContainer.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                    this.zoomIn();
                } else {
                    this.zoomOut();
                }
            }
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeModal(modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    saveProfile() {
        const sellerNameElement = document.getElementById('sellerName');
        const storeIdElement = document.getElementById('storeId');
        const storeNameElement = document.getElementById('storeName');
        
        const sellerName = sellerNameElement ? sellerNameElement.value : '';
        const storeId = storeIdElement ? storeIdElement.value : '';
        const storeName = storeNameElement ? storeNameElement.value : '';

        if (!sellerName || !storeId || !storeName) {
            this.showToast('매출자 정보를 모두 입력해주세요.', 'warning');
            return;
        }

        const sellerData = {
            name: sellerName,
            storeId: storeId,
            storeName: storeName
        };

        const existingIndex = this.sellers.findIndex(s => s.name === sellerName);
        if (existingIndex >= 0) {
            this.sellers[existingIndex] = sellerData;
        } else {
            this.sellers.push(sellerData);
        }

        this.saveSellers();
        this.updateSellerDropdown();

        const requestIdElement = document.getElementById('requestId');
        const requestNameElement = document.getElementById('requestName');
        const requestCenterElement = document.getElementById('requestCenter');
        const requestPhoneElement = document.getElementById('requestPhone');
        
        const requestData = {
            requestId: requestIdElement ? requestIdElement.value : '',
            requestName: requestNameElement ? requestNameElement.value : '',
            requestCenter: requestCenterElement ? requestCenterElement.value : '',
            requestPhone: requestPhoneElement ? requestPhoneElement.value : '',
            savedAt: new Date().toISOString()
        };

        localStorage.setItem('centerVisitRequestProfile', JSON.stringify(requestData));
        this.showToast('프로필이 저장되었습니다.', 'success');
    }

    loadProfile() {
        const savedRequest = localStorage.getItem('centerVisitRequestProfile');
        if (savedRequest) {
            const requestData = JSON.parse(savedRequest);
            
            const requestIdElement = document.getElementById('requestId');
            const requestNameElement = document.getElementById('requestName');
            const requestCenterElement = document.getElementById('requestCenter');
            const requestPhoneElement = document.getElementById('requestPhone');
            
            if (requestIdElement) requestIdElement.value = requestData.requestId || '';
            if (requestNameElement) requestNameElement.value = requestData.requestName || '';
            if (requestCenterElement) requestCenterElement.value = requestData.requestCenter || '';
            if (requestPhoneElement) requestPhoneElement.value = requestData.requestPhone || '';

            this.showToast('프로필이 불러와졌습니다.', 'success');
        } else {
            this.showToast('저장된 프로필이 없습니다.', 'warning');
        }
    }

    deleteSeller() {
        const selectedIndex = document.getElementById('sellerSelect').value;
        if (selectedIndex === '') {
            this.showToast('삭제할 매출자를 선택해주세요.', 'warning');
            return;
        }

        const sellerName = this.sellers[selectedIndex].name;
        if (confirm(`'${sellerName}' 매출자를 삭제하시겠습니까?`)) {
            this.sellers.splice(selectedIndex, 1);
            this.saveSellers();
            this.updateSellerDropdown();
            
            document.getElementById('sellerName').value = '';
            document.getElementById('storeId').value = '';
            document.getElementById('storeName').value = '';
            
            this.showToast('매출자가 삭제되었습니다.', 'success');
        }
    }

    saveSellers() {
        localStorage.setItem('centerVisitSellers', JSON.stringify(this.sellers));
    }

    updateSellerDropdown() {
        // 프로필 모달 드롭다운 업데이트
        const select = document.getElementById('sellerSelect');
        if (select) {
            select.innerHTML = '<option value="">새로 입력</option>';
            
            this.sellers.forEach((seller, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = seller.name;
                select.appendChild(option);
            });
        }

        // 메인 화면 드롭다운도 업데이트
        const mainSelect = document.getElementById('mainSellerSelect');
        if (mainSelect) {
            mainSelect.innerHTML = '<option value="">매출자를 선택하세요</option>';
            
            this.sellers.forEach((seller, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = seller.name;
                mainSelect.appendChild(option);
            });
        }
    }

    selectSeller(index) {
        const sellerNameElement = document.getElementById('sellerName');
        const storeIdElement = document.getElementById('storeId');
        const storeNameElement = document.getElementById('storeName');
        
        if (index === '') {
            if (sellerNameElement) sellerNameElement.value = '';
            if (storeIdElement) storeIdElement.value = '';
            if (storeNameElement) storeNameElement.value = '';
            return;
        }

        const seller = this.sellers[index];
        if (seller) {
            if (sellerNameElement) sellerNameElement.value = seller.name;
            if (storeIdElement) storeIdElement.value = seller.storeId;
            if (storeNameElement) storeNameElement.value = seller.storeName;
        }
    }

    saveTempData() {
        const tempData = this.getAllFormData();
        localStorage.setItem('centerVisitTempData', JSON.stringify(tempData));
    }

    loadSavedData() {
        const savedRequest = localStorage.getItem('centerVisitRequestProfile');
        if (savedRequest) {
            const requestData = JSON.parse(savedRequest);
            Object.keys(requestData).forEach(key => {
                const element = document.getElementById(key);
                if (element && requestData[key]) {
                    element.value = requestData[key];
                }
            });
        }

        const tempData = localStorage.getItem('centerVisitTempData');
        if (tempData) {
            const formData = JSON.parse(tempData);
            Object.keys(formData).forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = formData[key];
                    } else {
                        element.value = formData[key];
                    }
                }
            });
        }
    }

    getAllFormData() {
        const formData = {};
        const inputs = document.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                formData[input.id] = input.checked;
            } else {
                formData[input.id] = input.value;
            }
        });

        return formData;
    }

    openPreview() {
        // 먼저 데이터를 확인하고 생성
        const formData = this.getAllFormData();
        console.log('미리보기 데이터:', formData);
        
        this.generatePreview();
        this.openModal('previewModal');
        
        // 터치 제스처 지원 추가
        this.setupTouchGestures();
        
        // 모바일에서 미리보기 크기 조정 (resetZoom 대신 사용)
        this.adjustPreviewForMobile();
        
        // 스케일링 후 스크롤 위치를 최상단으로 이동 (약간의 지연 후 실행)
        setTimeout(() => {
            // 모달 자체의 스크롤을 최상단으로
            const modal = document.getElementById('previewModal');
            if (modal) {
                modal.scrollTop = 0;
            }
            
            // 미리보기 컨테이너 스크롤을 최상단으로 이동
            const previewContainer = document.querySelector('.preview-container');
            if (previewContainer) {
                previewContainer.scrollTop = 0;
            }
            
            // 미리보기 콘텐츠 스크롤도 최상단으로
            const previewContent = document.querySelector('.preview-content');
            if (previewContent) {
                previewContent.scrollTop = 0;
            }
            
            // 모바일에서 body 스크롤도 확인
            if (window.innerWidth <= 768) {
                window.scrollTo(0, 0);
                document.body.scrollTop = 0;
                document.documentElement.scrollTop = 0;
            }
        }, 100);
    }

    adjustPreviewForMobile() {
        const previewContent = document.querySelector('.preview-content');
        if (!previewContent) return;

        // 화면 크기에 따라 미리보기 크기 자동 조정
        const screenWidth = window.innerWidth;
        
        if (screenWidth <= 480) {
            // 작은 모바일: 읽기 쉬운 크기
            this.currentZoom = 0.75;
            console.log('작은 모바일 - 스케일:', this.currentZoom);
        } else if (screenWidth <= 768) {
            // 큰 모바일/태블릿: 조금 더 큰 크기
            this.currentZoom = 0.85;
            console.log('큰 모바일 - 스케일:', this.currentZoom);
        } else {
            // 데스크톱: 기본 크기
            this.currentZoom = 1.0;
            console.log('데스크톱 - 스케일:', this.currentZoom);
        }
        
        this.applyZoom();
    }

    generatePreview() {
        const formData = this.getAllFormData();
        const previewContent = document.getElementById('previewContent');
        
        if (!previewContent) {
            console.error('미리보기 컨테이너를 찾을 수 없습니다.');
            this.showToast('미리보기 생성에 실패했습니다.', 'error');
            return;
        }
        
        let visitDateFormatted = '';
        if (formData.visitDate) {
            const visitDate = new Date(formData.visitDate);
            visitDateFormatted = `${visitDate.getFullYear().toString().slice(-2)} 년 ${String(visitDate.getMonth() + 1).padStart(2, '0')} 월 ${String(visitDate.getDate()).padStart(2, '0')} 일`;
        }

        let visitTimeFormatted = '';
        if (formData.visitTime) {
            const [hours, minutes] = formData.visitTime.split(':');
            visitTimeFormatted = `${hours} 시 ${minutes} 분`;
        }

        // 번호이동 시 기존 통신사/번호 표시 로직
        let currentInfoText = '';
        if (formData.numberPorting) {
            if (formData.currentNumber && formData.currentCarrier) {
                currentInfoText = `${formData.currentCarrier} / ${formData.currentNumber}`;
            } else if (formData.currentNumber) {
                currentInfoText = formData.currentNumber;
            } else if (formData.currentCarrier) {
                currentInfoText = formData.currentCarrier;
            }
        }
        
        // 디버깅용 로그
        console.log('FormData:', formData);
        console.log('미리보기 생성 시작');

        const previewHTML = `
            <div class="document-header">
                <div class="document-title">센터방문 개통 요청서</div>
                <div style="text-align: right; margin-top: 10px; font-family: monospace; font-weight: bold; font-size: 16px; color: #000; background: none; border: none; box-shadow: none;">
                    ${formData.prepaid ? '[✓] 선불' : '[  ] 선불'} 
                    ${formData.postpaid ? '[✓] 후불' : '[  ] 후불'} / 
                    ${formData.newContract ? '[✓] 신규개통' : '[  ] 신규개통'} 
                    ${formData.numberPorting ? '[✓] 번호이동' : '[  ] 번호이동'}
                </div>
            </div>

            <div class="section-header">▶ 개통 관련 기재란</div>
            <table class="form-table">
                <tr>
                    <td rowspan="2" class="label-cell">매출자 정보</td>
                    <td class="label-cell">회원번호</td>
                    <td class="label-cell">회원명</td>
                </tr>
                <tr>
                    <td class="value-cell">${formData.storeId || ''}</td>
                    <td class="value-cell">${formData.storeName || ''}</td>
                </tr>
                <tr>
                    <td class="label-cell">명의자 성명</td>
                    <td class="label-cell">명의자 생년월일</td>
                    <td class="label-cell">명의자 연락번호</td>
                </tr>
                <tr>
                    <td class="value-cell">${formData.ownerName || ''}</td>
                    <td class="value-cell">${formData.ownerBirth || ''}</td>
                    <td class="value-cell">${formData.ownerPhone || ''}</td>
                </tr>
                <tr>
                    <td class="label-cell">통신망 선택</td>
                    <td class="label-cell">가입 요금제<br/>(사전 설명 필수)</td>
                    <td class="label-cell">(번호이동 시)<br/>기존 통신사 / 기존번호</td>
                </tr>
                <tr>
                    <td class="value-cell">${formData.planNetwork || ''}</td>
                    <td class="value-cell">${formData.planName || ''}</td>
                    <td class="value-cell">${formData.numberPorting ? currentInfoText : ''}</td>
                </tr>
                <tr>
                    <td class="label-cell">방문 예약 시간</td>
                    <td colspan="2" class="value-cell">${visitDateFormatted} ${visitTimeFormatted}</td>
                </tr>
                <tr>
                    <td class="label-cell">특이사항</td>
                    <td colspan="2" class="value-cell">${formData.specialNote || ''}</td>
                </tr>
            </table>

            <div class="notice-text">
                ※ 연체, 미납 정지 단말기, 부가서비스 등 개통 관련 특이사항 입력
            </div>

            <div class="section-header">▶ 요청 회원 및 센터 기재란</div>
            <table class="form-table">
                <tr>
                    <td rowspan="4" class="label-cell">요청 회원 정보</td>
                    <td class="label-cell">회원번호</td>
                    <td class="label-cell">회원명</td>
                </tr>
                <tr>
                    <td class="value-cell">${formData.requestId || ''}</td>
                    <td class="value-cell">${formData.requestName || ''}</td>
                </tr>
                <tr>
                    <td class="label-cell">소속 센터 / 활동 지역</td>
                    <td class="label-cell">연락번호</td>
                </tr>
                <tr>
                    <td class="value-cell">${formData.requestCenter || ''}</td>
                    <td class="value-cell">${formData.requestPhone || ''}</td>
                </tr>
                <tr>
                    <td rowspan="2" class="label-cell">개통 처리 정보</td>
                    <td class="label-cell">개통 센터</td>
                    <td class="label-cell">개통 확정 번호</td>
                </tr>
                <tr>
                    <td class="value-cell tall-cell"></td>
                    <td class="value-cell tall-cell"></td>
                </tr>
            </table>

            <div class="notice-text">
                ※ 개통 시 주의사항
            </div>

            <div class="notice-section">
                <div class="notice-item">▶ 방문 개통 명의자 본인 확인 후 <span style="color: red; font-weight: bold;">개통 본인확인서(필수)</span>를 반드시 작성하여 주세요.</div>
                <div class="notice-item">▶ 다회선 개통 요청 시 개통 의뢰 회원에게 내용 확인 후 개통 진행해주세요.</div>
                <div class="notice-item">▶ 부정영업이 의심이 되는 경우 개통을 거부할 수 있습니다.</div>
                <div class="notice-sub">- 본인 신상용 외 타인 판매 양도 불법 스팩 보이스피싱 등</div>
                <div class="notice-item">▶ 요금제 설명 및 안내 등을 체크하여 방문 센터에 사전 등록 후 요정하여 주세요.</div>
            </div>

            <div class="bottom-logo">
                <img src="https://i.ibb.co/rfzJK0KM/X.jpg" alt="N telecom 컨설팅그룹" />
            </div>
        `;
        
        previewContent.innerHTML = previewHTML;
        
        // 미리보기 생성 완료 로그
        console.log('미리보기 생성 완료');
    }

    async downloadImage() {
        try {
            this.showToast('이미지를 생성 중입니다...', 'info');
            
            const previewContent = document.getElementById('previewContent');
            if (!previewContent) {
                throw new Error('미리보기 요소를 찾을 수 없습니다.');
            }
            
            // 임시 캡처용 컨테이너 생성
            const captureWrapper = document.createElement('div');
            captureWrapper.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 932px;
                height: auto;
                background: white;
                padding: 60px;
                font-family: 'Malgun Gothic', sans-serif;
                font-size: 16px;
                line-height: 1.6;
                color: #000;
                z-index: 10000;
                box-sizing: border-box;
            `;
            
            // 내용 복사
            captureWrapper.innerHTML = previewContent.innerHTML;
            document.body.appendChild(captureWrapper);
            
            // 스타일 강제 적용
            this.applyCaptureStyles(captureWrapper);
            
            // 이미지 로딩 대기
            const images = captureWrapper.querySelectorAll('img');
            for (const img of images) {
                if (!img.complete) {
                    await new Promise(resolve => {
                        img.onload = resolve;
                        img.onerror = resolve;
                        setTimeout(resolve, 2000);
                    });
                }
            }
            
            // 잠깐 대기
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // 실제 높이 계산
            const contentHeight = Math.max(1400, captureWrapper.scrollHeight);
            
            // html2canvas 옵션
            const options = {
                backgroundColor: '#ffffff',
                width: 932,
                height: contentHeight,
                scale: 1,
                useCORS: true,
                allowTaint: true,
                logging: false
            };
            
            console.log('캡처 시작...', options);
            
            // 캡처 실행
            const canvas = await html2canvas(captureWrapper, options);
            
            // 임시 요소 제거
            document.body.removeChild(captureWrapper);
            
            console.log('캡처 완료:', canvas.width, 'x', canvas.height);
            
            // 캔버스 검증
            if (!canvas || canvas.width === 0 || canvas.height === 0) {
                throw new Error('캔버스 생성에 실패했습니다.');
            }
            
            // JPG로 변환
            const dataURL = canvas.toDataURL('image/jpeg', 0.9);
            
            // 다운로드 링크 생성
            const now = new Date();
            const fileName = `센터방문개통요청서_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}.jpg`;
            
            const link = document.createElement('a');
            link.download = fileName;
            link.href = dataURL;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            
            setTimeout(() => {
                if (document.body.contains(link)) {
                    document.body.removeChild(link);
                }
            }, 1000);
            
            this.showToast('이미지가 다운로드되었습니다!', 'success');
            
        } catch (error) {
            console.error('다운로드 오류:', error);
            this.showToast(`다운로드 중 오류가 발생했습니다: ${error.message}`, 'error');
        }
    }

    applyCaptureStyles(container) {
        // 문서 제목 스타일 - 크기 대폭 확대
        const title = container.querySelector('.document-title');
        if (title) {
            title.style.fontSize = '32px';
            title.style.fontWeight = 'bold';
            title.style.marginBottom = '30px';
            title.style.textAlign = 'center';
            title.style.letterSpacing = '4px';
            title.style.color = '#000';
        }

        // 섹션 헤더 스타일
        const sectionHeaders = container.querySelectorAll('.section-header');
        sectionHeaders.forEach(header => {
            header.style.fontSize = '18px';
            header.style.fontWeight = 'bold';
            header.style.margin = '30px 0 20px 0';
        });

        // 체크박스 섹션은 이제 인라인 스타일로 처리됨 (CSS 클래스 사용 안함)

        // 문서 헤더 스타일
        const documentHeader = container.querySelector('.document-header');
        if (documentHeader) {
            documentHeader.style.position = 'relative';
            documentHeader.style.marginBottom = '20px';
            documentHeader.style.minHeight = '50px';
        }

        // 체크박스는 이미 텍스트로 변경됨 (☑ ☐ 사용)

        // 테이블 스타일
        const tables = container.querySelectorAll('.form-table');
        tables.forEach(table => {
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            table.style.marginBottom = '25px';
            table.style.tableLayout = 'fixed';
            table.style.fontSize = '15px';

            const cells = table.querySelectorAll('td, th');
            cells.forEach(cell => {
                cell.style.border = '1px solid #000';
                cell.style.textAlign = 'center';
                cell.style.verticalAlign = 'middle';
                cell.style.wordWrap = 'break-word';
                cell.style.wordBreak = 'break-word';
                cell.style.overflow = 'hidden';
            });

            const labelCells = table.querySelectorAll('.label-cell');
            labelCells.forEach(cell => {
                cell.style.backgroundColor = '#d3d3d3';
                cell.style.fontWeight = 'bold';
                cell.style.fontSize = '15px';
                cell.style.padding = '18px 12px';
                cell.style.lineHeight = '1.4';
            });

            const valueCells = table.querySelectorAll('.value-cell');
            valueCells.forEach(cell => {
                cell.style.backgroundColor = 'white';
                cell.style.fontSize = '15px';
                cell.style.padding = '18px 15px';
                cell.style.lineHeight = '1.4';
                cell.style.minHeight = '50px';
            });
        });

        // 주의사항 스타일
        const noticeText = container.querySelectorAll('.notice-text');
        noticeText.forEach(note => {
            note.style.fontSize = '16px';
            note.style.lineHeight = '1.6';
            note.style.margin = '30px 0 25px 0';
            note.style.color = '#333';
        });

        const noticeSection = container.querySelectorAll('.notice-section');
        noticeSection.forEach(section => {
            section.style.fontSize = '16px';
            section.style.lineHeight = '1.6';
            section.style.marginTop = '30px';
            section.style.marginBottom = '25px';
        });

        const noticeItems = container.querySelectorAll('.notice-item');
        noticeItems.forEach(item => {
            item.style.marginBottom = '12px';
            item.style.fontSize = '16px';
        });

        const noticeSub = container.querySelectorAll('.notice-sub');
        noticeSub.forEach(sub => {
            sub.style.marginLeft = '25px';
            sub.style.fontSize = '14px';
            sub.style.color = '#666';
            sub.style.marginBottom = '8px';
        });

        // 하단 로고 스타일 - 우측 정렬
        const bottomLogo = container.querySelector('.bottom-logo');
        if (bottomLogo) {
            bottomLogo.style.textAlign = 'right';
            bottomLogo.style.marginTop = '25px';
            bottomLogo.style.marginBottom = '20px';
            bottomLogo.style.paddingRight = '0px';
            bottomLogo.style.width = '100%';
            bottomLogo.style.display = 'block';
        }

        const logoImg = container.querySelector('.bottom-logo img');
        if (logoImg) {
            logoImg.style.width = '100px';
            logoImg.style.height = 'auto';
            logoImg.style.opacity = '0.9';
            logoImg.style.display = 'inline-block';
            logoImg.style.marginLeft = 'auto';
            logoImg.style.float = 'right';
        }
    }

    showToast(message, type = 'info') {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#007bff'};
            color: ${type === 'warning' ? '#000' : 'white'};
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(100%);
            animation: slideIn 0.3s ease forwards;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                to { transform: translateX(0); }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, 3000);
    }

    loadSellers() {
        const saved = localStorage.getItem('centerVisitSellers');
        return saved ? JSON.parse(saved) : [];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CenterVisitApp();
}); 