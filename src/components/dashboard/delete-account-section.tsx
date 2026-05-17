"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { deleteAccount } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  Loader2, 
  ShieldAlert 
} from "lucide-react";
import { cn } from "@/lib/utils";

export function DeleteAccountSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signOut } = useClerk();

  const CONFIRM_PHRASE = "HESABIMI SİL";

  const handleDelete = async () => {
    if (confirmText !== CONFIRM_PHRASE) return;
    setLoading(true);
    setError(null);
    try {
      const res = await deleteAccount();
      if (res.success) {
        // Sign out Clerk session and redirect to homepage
        await signOut();
        window.location.href = "/";
      }
    } catch (err: any) {
      setError(err?.message || "Hesabınız silinirken beklenmedik bir hata oluştu.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Danger Zone Card */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-[32px] p-8 shadow-sm transition-colors duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-sm font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
              Tehlikeli Bölge (Danger Zone)
            </h3>
            <p className="text-xs md:text-sm font-bold text-muted-foreground/80 leading-relaxed max-w-xl">
              Hesabınızı sildiğinizde; varlıklarınız, gelir-giderleriniz, borçlarınız, yatırımlarınız, blog gönderileriniz, takipçi ilişkileriniz ve tüm verileriniz kalıcı olarak veritabanımızdan silinir. Bu işlem geri alınamaz.
            </p>
          </div>
          <Button 
            type="button" 
            variant="destructive"
            onClick={() => {
              setConfirmText("");
              setError(null);
              setIsOpen(true);
            }}
            className="h-12 w-full md:w-auto px-6 rounded-2xl font-extrabold flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Trash2 className="h-5 w-5" />
            Hesabımı Kalıcı Olarak Sil
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur overlay */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
            onClick={() => !loading && setIsOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-card border border-border/40 rounded-[32px] p-6 md:p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 z-10 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-500/10 text-red-500 rounded-2xl">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-foreground font-heading">Hesabınızı Silmek İstediğinize Emin misiniz?</h4>
                  <p className="text-xs text-muted-foreground font-bold mt-0.5">Bu işlem geri alınamaz ve tüm verileriniz silinir.</p>
                </div>
              </div>
              {!loading && (
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-muted rounded-xl text-muted-foreground transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Warning Message */}
            <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/10 text-xs font-semibold text-red-500 leading-relaxed">
              <p className="font-extrabold mb-1">⚠️ UYARI:</p>
              Bu işlem veri tabanımızda kayıtlı olan size ait tüm finansal özetleri (Kripto, BIST, NASDAQ, Altın, BES, Mevduat), borç taksitlerini, gelir-gider akışını ve topluluk paylaşımlarını bir saniyede kalıcı olarak silecektir.
            </div>

            {/* Confirm Input */}
            <div className="space-y-3">
              <Label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest block">
                Onaylamak için lütfen büyük harflerle <span className="text-red-500 font-black font-mono">"{CONFIRM_PHRASE}"</span> yazın:
              </Label>
              <Input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={CONFIRM_PHRASE}
                disabled={loading}
                className="h-12 rounded-2xl bg-muted/40 font-black text-center text-foreground placeholder:text-muted-foreground/30 border-border/50 focus:border-red-500/50 focus:ring-red-500/20"
              />
            </div>

            {error && (
              <p className="text-[11px] font-extrabold text-red-500 bg-red-500/5 p-3 rounded-xl border border-red-500/10 text-center">
                {error}
              </p>
            )}

            {/* Modal Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => setIsOpen(false)}
                className="h-12 w-full sm:flex-1 rounded-2xl font-bold border-border/50 text-foreground hover:bg-muted"
              >
                Vazgeç
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={loading || confirmText !== CONFIRM_PHRASE}
                onClick={handleDelete}
                className={cn(
                  "h-12 w-full sm:flex-1 rounded-2xl font-black bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 shadow-lg transition-all",
                  confirmText !== CONFIRM_PHRASE && "opacity-50 cursor-not-allowed"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Siliniyor...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-5 w-5" />
                    Evet, Hesabımı Kalıcı Sil
                  </>
                )}
              </Button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
