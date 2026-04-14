import re
import os

path = r'E:\project\platform-yaokong-main\platform-yaokong-main\backend\app\services\video_service.py'
with open(path, 'r', encoding='utf-8') as f:
    orig = f.read()

pat = re.compile(r'(    def list_alarm_videos_direct\([\s\S]*?\n        return clips\n)')
match = pat.search(orig)
if match:
    print("MATCHED", len(match.group(1)))
    old_str = match.group(1)
    
    new_str = """    def list_alarm_videos_direct(self, video_id: int, limit: int = 120, sort_order: str = "desc") -> list[dict]:
        \"\"\"
        获取指定视频设备的报警录制视频列表（结合 static/alarms 的图片和 static/recordings 的视频）
        用于"报警监控回放"
        \"\"\"
        alarm_root = self._get_alarm_screenshot_root()  # 用截图目录
        record_dir = os.path.join(self._get_record_root(), str(video_id))
        
        if not os.path.isdir(alarm_root):
            return []

        clips: list[dict] = []
        sort_reverse = sort_order.lower() == "desc"
        video_id_str = str(video_id)
        
        # 预加载录像片段的信息
        import glob
        from datetime import datetime
        record_files = []
        if os.path.isdir(record_dir):
            for rp in glob.glob(os.path.join(record_dir, "*.mp4")):
                try:
                    name = os.path.basename(rp)
                    # 格式：YYYYMMDD_HHMMSS.mp4
                    time_str = name.split(".")[0]
                    dt = datetime.strptime(time_str, "%Y%m%d_%H%M%S")
                    record_files.append((dt.timestamp(), rp))
                except Exception:
                    pass
            record_files.sort(key=lambda x: x[0])
            
        for file_path in sorted(glob.glob(os.path.join(alarm_root, "*.jpg")), reverse=sort_reverse):
            file_name = os.path.basename(file_path)
            # 格式: 358_1775532666_6ef48f.jpg
            if f"_{video_id_str}_" not in file_name and not file_name.startswith(f"{video_id_str}_"):
                continue
            
            try:
                parts = file_name.split("_")
                ts = None
                if len(parts) >= 2 and parts[1].isdigit():
                    ts = float(parts[1])
                else:
                    ts = os.stat(file_path).st_mtime
                alarm_dt = datetime.fromtimestamp(ts)
                
                # 寻找最匹配的录像文件
                best_video_path = None
                best_diff = float("inf")
                
                for r_ts, rp in record_files:
                    # 如果报警时间在录像时间内（即录像开始后60秒内）
                    if r_ts <= ts < r_ts + 60:
                        best_video_path = rp
                        break
                    # 或者寻找时间最近的
                    elif 0 <= ts - r_ts < best_diff:
                        best_diff = ts - r_ts
                        best_video_path = rp

                if best_video_path:
                    v_stat = os.stat(best_video_path)
                    v_name = os.path.basename(best_video_path)
                    
                    clips.append({
                        "name": f"alarm_{v_name}",
                        "size_bytes": int(v_stat.st_size),
                        "updated_at": alarm_dt.strftime("%Y-%m-%d %H:%M:%S"),
                        "web_path": self._to_static_web_path(best_video_path),
                        "duration_text": self._format_bytes(v_stat.st_size) if v_stat.st_size < 1024*1024 else f"{v_stat.st_size/(1024*1024):.2f}MB",
                        "thumbnail": self._to_static_web_path(file_path)
                    })
            except Exception as e:
                continue

            if len(clips) >= max(1, min(limit, 500)):
                break

        return clips
"""
    new_orig = orig.replace(old_str, new_str)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_orig)
    print("Replaced!")
else:
    print("NO MATCH")
