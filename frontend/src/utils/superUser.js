// 시연·테스트용 슈퍼 계정: GPS 반경과 상관없이 어느 지점에서든 도장을 찍을 수 있다.
// 위치 검사는 클라이언트에서만 하므로, 여기 있는 아이디만 반경 검사를 건너뛴다.
const SUPER_USERNAMES = new Set(["admin", "admin1", "admin2", "admin3"]);

export function isSuperUser(username) {
  return SUPER_USERNAMES.has(username);
}
