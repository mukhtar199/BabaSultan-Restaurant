export function getCanonicalBranchId(rawBranch?: string | null): string {
  if (!rawBranch || typeof rawBranch !== 'string') return '';
  const trimmed = rawBranch.trim();
  if (!trimmed) return '';
  if (trimmed === 'all') return 'all';
  const lower = trimmed.toLowerCase();
  if (lower === 'main_branch_01') return 'main_branch_01';
  if (lower === 'branch_hq_01') return 'branch_hq_01';
  if (lower === 'branch_hargeisa_01') return 'branch_hargeisa_01';
  if (lower === 'branch_kismayo_01') return 'branch_kismayo_01';

  if (lower.includes('hargeisa') || lower === 'br-har-02') {
    return 'branch_hargeisa_01';
  }
  if (lower.includes('kismayo') || lower === 'br-kis-03') {
    return 'branch_kismayo_01';
  }
  if (
    lower.includes('main') ||
    lower.includes('flagship') ||
    lower.includes('headquarters') ||
    lower.includes('mogadishu') ||
    lower === 'hq-mog-01' ||
    lower === 'br-001'
  ) {
    return 'branch_hq_01';
  }
  return trimmed;
}

export function areBranchesMatching(b1?: string | null, b2?: string | null): boolean {
  if (!b1 || !b2) return false;
  const c1 = getCanonicalBranchId(b1);
  const c2 = getCanonicalBranchId(b2);
  if (!c1 || !c2) return false;
  if (c1 === c2) return true;
  const isHQ1 = c1 === 'branch_hq_01' || c1 === 'main_branch_01' || c1 === 'hq-mog-01';
  const isHQ2 = c2 === 'branch_hq_01' || c2 === 'main_branch_01' || c2 === 'hq-mog-01';
  if (isHQ1 && isHQ2) return true;
  return false;
}

export function getBranchDisplayName(branchId?: string | null): string {
  const canon = getCanonicalBranchId(branchId);
  if (canon === 'branch_hargeisa_01') return 'Hargeisa Flagship Branch';
  if (canon === 'branch_kismayo_01') return 'Kismayo Coastal Express';
  if (canon === 'branch_hq_01' || canon === 'main_branch_01') return 'Headquarters - Mogadishu Main';
  if (canon === 'all') return 'All Branches (HQ)';
  return 'Unassigned Branch';
}
