import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import {
  exportForMigration,
  clearProgress,
  hasProgressToMigrate,
  readProgress,
} from "../hooks/useAnonymousProgress";

const DECLINED_KEY = "songscript_migration_declined_by";
const COMPLETED_KEY = "songscript_migration_completed";

/**
 * Mark migration as completed for this session (prevents modal from re-opening)
 */
function markMigrationCompleted(): void {
  sessionStorage.setItem(COMPLETED_KEY, "true");
}

/**
 * Check if migration was just completed this session
 */
function wasMigrationJustCompleted(): boolean {
  return sessionStorage.getItem(COMPLETED_KEY) === "true";
}

/**
 * Get the array of userIds who declined migration on this device
 */
function getDeclinedUserIds(): string[] {
  try {
    const stored = localStorage.getItem(DECLINED_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id) => typeof id === "string");
  } catch {
    return [];
  }
}

/**
 * Add a userId to the declined list
 */
function addDeclinedUserId(userId: string): void {
  const current = getDeclinedUserIds();
  if (!current.includes(userId)) {
    current.push(userId);
    localStorage.setItem(DECLINED_KEY, JSON.stringify(current));
  }
}

/**
 * Remove a userId from the declined list (used when user imports via Settings)
 */
export function removeDeclinedUserId(userId: string): void {
  const current = getDeclinedUserIds();
  const updated = current.filter((id) => id !== userId);
  localStorage.setItem(DECLINED_KEY, JSON.stringify(updated));
}

/**
 * Check if a user has declined migration on this device
 */
export function hasDeclinedMigration(userId: string): boolean {
  return getDeclinedUserIds().includes(userId);
}

/**
 * Check if the migration modal should be shown
 */
export function shouldShowMigrationModal(userId: string | undefined): boolean {
  if (!userId) return false;
  if (typeof window === "undefined") return false;
  if (wasMigrationJustCompleted()) return false;
  if (!hasProgressToMigrate()) return false;
  if (hasDeclinedMigration(userId)) return false;
  return true;
}

interface MigrationConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function MigrationConfirmModal({
  isOpen,
  onClose,
  userId,
}: MigrationConfirmModalProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const migrateData = useMutation(api.migration.migrateAnonymousData);

  // Get progress summary for display
  const progress = readProgress();
  const wordCount = progress.wordProgress.filter((w) => w.learned).length;
  const lineCount = progress.lineProgress.filter((l) => l.learned).length;
  const songCount = progress.songProgress.length;

  const handleImport = async () => {
    setIsImporting(true);
    setImportResult(null);

    try {
      const progressData = exportForMigration();
      const result = await migrateData({ progressData });

      const totalMigrated = Object.values(result).reduce(
        (sum: number, count) => {
          if (typeof count === "number") return sum + count;
          return sum;
        },
        0
      );

      // Clear localStorage after successful migration
      clearProgress();

      // Mark migration as completed for this session (prevents modal from re-opening)
      markMigrationCompleted();

      // Remove user from declined list (in case they're importing from Settings after declining)
      removeDeclinedUserId(userId);

      setImportResult({
        success: true,
        message: `Successfully imported ${totalMigrated} records!`,
      });

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Migration failed:", error);
      setImportResult({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to import progress",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDecline = () => {
    addDeclinedUserId(userId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            Import Your Progress?
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            We found learning progress saved on this device.
          </DialogDescription>
        </DialogHeader>

        {/* Progress summary */}
        <div className="bg-gray-800/50 rounded-lg p-4 my-2">
          <p className="text-sm text-gray-300 mb-3">
            Found on this device:
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-2xl font-bold text-emerald-400">
                {wordCount}
              </div>
              <div className="text-xs text-gray-400">
                {wordCount === 1 ? "word" : "words"}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400">
                {lineCount}
              </div>
              <div className="text-xs text-gray-400">
                {lineCount === 1 ? "line" : "lines"}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400">
                {songCount}
              </div>
              <div className="text-xs text-gray-400">
                {songCount === 1 ? "song" : "songs"}
              </div>
            </div>
          </div>
        </div>

        {/* Result message */}
        {importResult && (
          <div
            className={`text-sm text-center p-2 rounded ${
              importResult.success
                ? "bg-emerald-900/50 text-emerald-300"
                : "bg-red-900/50 text-red-300"
            }`}
          >
            {importResult.message}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={handleDecline}
            disabled={isImporting}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            No thanks
          </Button>
          <Button
            onClick={handleImport}
            disabled={isImporting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isImporting ? "Importing..." : "Import to my account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default MigrationConfirmModal;
