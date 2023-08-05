
// 카카오 로그인 js
    window.Kakao.init('3d590a003ae4723eaedb07f1797aa8ba');

    function kakaoLogin() {
        window.Kakao.Auth.login({
            scope: 'profile_nickname, account_email, gender, age_range', //동의항목 페이지에 있는 개인정보 보호 테이블의 활성화된 ID값을 넣습니다.
            success: function(response) {
                console.log(response) // 로그인 성공하면 받아오는 데이터
                window.Kakao.API.request({ // 사용자 정보 가져오기 
                    url: '/v2/user/me',
                    success: (res) => {
                        const kakao_account = res.kakao_account;
                        console.log(kakao_account)
                    }
                });
                // window.location.href='/ex/kakao_login.html' //리다이렉트 되는 코드
            },
            fail: function(error) {
                console.log(error);
            }
        });
    }

// 회원가입 중복체크 js
$(document).ready(function () {
    $('#checkId').click(function () {
        let inputId = $('#id').val();
        if (inputId !== "") {
            // 중복되는 아이디일 경우 아래 alert 창이 실행
            alert('사용 중인 아이디입니다.');
        }
        else {
            alert('아이디를 입력해주세요.');
        }
    });
});
