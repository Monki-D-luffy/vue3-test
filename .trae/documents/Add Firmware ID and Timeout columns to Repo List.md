I will update the **Firmware Repository List** in `src/views/ota/components/RepoManager.vue` to display the missing fields as requested, matching the "Upper Computer" (上位机) interface.

**Changes:**
1.  **Add "Firmware Repo ID" Column**:
    *   Insert a new column for `firmwaresRepoId` at the beginning of the table.
    *   This matches the "固件库 ID" in your screenshot.
2.  **Add "Upgrade Timeout" Column**:
    *   Insert a new column for `updateTimeoutValue` (displayed as "升级超时(s)") after the "Channel" column.
    *   This matches the "升级超时(s)" in your screenshot.

**File to Edit:**
*   `src/views/ota/components/RepoManager.vue`

**Result:**
The table columns will be ordered as:
1.  **固件库 ID** (New)
2.  仓库名称 (Existing)
3.  类型 (Existing)
4.  通道 (Existing)
5.  **升级超时(s)** (New)
6.  备注 (Existing)
7.  操作 (Existing)

This will ensure your frontend displays all the critical firmware information available in the backend/upper computer.