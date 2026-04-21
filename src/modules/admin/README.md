# Module: Admin Panel (01)

**DNA:** Interaksi dominant
**Status:** Skeleton (Phase 1). Akan di-expand di Phase 2+.

## Rencana isi folder

```
admin/
├── module.config.ts         ✅ ada
├── index.ts                 ✅ ada
├── components/              ⏳ Phase 2 (data tables, entity forms, dst)
├── services/                ⏳ Phase 2 (user mgmt, activity log)
├── migrations/              ⏳ Phase 2 (activity_logs table)
└── validators.ts            ⏳ Phase 2
```

## Import rules

- ✅ Boleh import dari: `@/core/*`, `@/shared/*`, `@/config`
- ❌ Gak boleh import dari module lain (`@/modules/saas`, dll)
