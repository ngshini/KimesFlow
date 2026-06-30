type ZaloSendResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };

export function hasZaloEnv() {
  return Boolean(process.env.ZALO_ACCESS_TOKEN && process.env.ZALO_OA_ID);
}

export async function sendZaloMessage(_userId: string | null | undefined, _message: string): Promise<ZaloSendResult> {
  void _userId;
  void _message;

  if (!hasZaloEnv()) {
    return { ok: false, error: "Zalo chưa được cấu hình." };
  }

  return { ok: false, error: "Zalo provider mới ở mức placeholder. Chưa gửi API thật." };
}
