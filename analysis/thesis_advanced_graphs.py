import os
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import matplotlib.ticker as mticker
import argparse
import datetime

def format_seconds_to_mm_ss(x, pos):
    minutes = int(x // 60)
    seconds = int(x % 60)
    return f"{minutes:02d}:{seconds:02d}"

def plot_graphs(session_names, hosts, output_dir, group_name):
    root_dir = "/usr/local/dos-mitigation/data"
    session_paths = [ os.path.join(root_dir, session_name) for session_name in session_names]
    
    for session_path in session_paths:
        if not os.path.isdir(session_path):
            print(f"Session path does not exist: {session_path}")
            return
    
    experiments_all = [sorted([os.path.join(session_path, exp) for exp in os.listdir(session_path)
                if os.path.isdir(os.path.join(session_path, exp))])
                for session_path in session_paths]
    scenarios = ['UB', 'MB', 'UA', 'MA']
    scenario_colors = ['#7aa755', '#4f71be', '#b02418', '#f6c242']

    # print(experiments_all)

    # write session names to directory
    out_dir = os.path.join(output_dir, group_name)
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, "sessions.txt"), "w") as outfile:
        for session in session_names:
            outfile.write(f"{session}\n")

    for (i, experiments) in enumerate(zip(*experiments_all)):
        # print(experiments)
        out_dir = os.path.join(output_dir, group_name, str(i))
        os.makedirs(out_dir, exist_ok=True)
        # Copy .settings file
        settings_path = os.path.join(experiments[0], ".settings")
        if os.path.isfile(settings_path):
            destination = os.path.join(out_dir, ".settings")
            try:
                import shutil
                shutil.copy2(settings_path, destination)
                print(f"Copied settings file to: {destination}")
            except Exception as e:
                print(f"Failed to copy settings file: {e}")
        else:
            print(f"Settings file not found: {settings_path}")

        for host in hosts:
            all_data = []
            for exp in experiments:
                for scenario in scenarios:
                    csv_path = os.path.join(exp, host, scenario, "logs", "jitsi.csv")
                    if not os.path.exists(csv_path):
                        print(f"{csv_path} not found")
                        return
                    try:
                        df = pd.read_csv(csv_path)
                    except Exception as e:
                        print(f"Failed to read {csv_path}: {e}")
                        return

                    if 'timestamp' not in df.columns:
                        print(f"Missing 'timestamp' in {csv_path}")
                        return

                    df['timestamp'] = pd.to_datetime(df['timestamp'], unit="ms")
                    df['jitsi_bitrate_upload_minus_download'] = df['jitsi_bitrate_upload'] - df['jitsi_bitrate_download']
                    df['rtc_bitrateKbps_upload_minus_download'] = df['rtc_bitrateKbps_upload'] - df['rtc_bitrateKbps_download']
                    df['rtc_framesPerSecond_upload_minus_download'] = df['rtc_framesPerSecond_upload'] - df['rtc_framesPerSecond_download']
                    df['relative_time'] = (df['timestamp'] - df['timestamp'].min()).dt.total_seconds()
                    df['scenario'] = scenario
                    all_data.append(df)

                if not all_data:
                    "empty all_data"
                    return

            merged_df = pd.concat(all_data)
            mask = (merged_df['relative_time']>= 15) & (merged_df['relative_time'] <= 30)
            filtered_df = merged_df[mask]

            qos_host_dir = os.path.join(out_dir, "qos", host)
            os.makedirs(qos_host_dir, exist_ok=True)
            with open(os.path.join(qos_host_dir, "averages.txt"), "w") as outfile:
                for col in merged_df.columns:
                    if col in ['timestamp', 'relative_time', 'scenario']:
                        continue

                    individual_figures = {
                        scenario: plt.figure(figsize=(10,6)) for scenario in scenarios
                    }

                    cons_scen_figure = plt.figure(figsize=(10,6))
                    cons_scen_axes = cons_scen_figure.add_subplot(1, 1, 1)
                    qos_figure = plt.figure(figsize=(10,6))
                    qos_axes = qos_figure.add_subplot(1, 1, 1)
                    
                    cons_scen_y_view_max = float('-inf')
                    cons_scen_y_view_min = float('inf')
                    for scenario, group in merged_df.groupby('scenario'):
                        individual_axes = individual_figures[scenario].add_subplot(1,1,1)

                        group_copy = group.copy()
                        group_copy['relative_time'] = pd.to_timedelta(group_copy['relative_time'], unit='s')
                        group_copy = group_copy.set_index('relative_time')
                        averaged = group_copy[col].resample('500ms').mean()

                        averaged.index = averaged.index.total_seconds()
                        
                        averaged.plot(ax=individual_axes)
                        averaged.plot(ax=cons_scen_axes, label=scenario)

                        if 'jitsi_packetloss' in col:
                            cons_scen_axes.set_ylim(0,100.5)
                            cons_scen_axes.set_ylabel(col + " (percent)")
                        else:
                            cons_scen_y_view_min = min(0,averaged.min(), cons_scen_y_view_min)
                            cons_scen_y_view_max = max(averaged.max(), cons_scen_y_view_max)
                            diff = cons_scen_y_view_max - cons_scen_y_view_min
                            cons_scen_axes.set_ylim((cons_scen_y_view_min - 0.1*diff, cons_scen_y_view_max + 0.1*diff))
                            cons_scen_axes.set_ylabel(col)

                        if 'jitsi_packetloss' in col:
                            individual_axes.set_ylim(0,100.5)
                            individual_axes.set_ylabel(col + " (percent)")
                        else:
                            y_view_min = min(0,averaged.min())
                            y_view_max = averaged.max()
                            diff = y_view_max - y_view_min
                            individual_axes.set_ylim((y_view_min - 0.1*diff, y_view_max + 0.1*diff))
                            individual_axes.set_ylabel(col)

                        individual_axes.set_xlabel('time from experiment start')
                        individual_axes.xaxis.set_major_formatter(mticker.FuncFormatter(format_seconds_to_mm_ss))
                        individual_axes.set_xlim(0, 45)
                        x1_3 = 15
                        x2_3 = 30
                        individual_axes.axvline(x=x1_3, color='red', linestyle='--', linewidth=1)
                        individual_axes.axvline(x=x2_3, color='blue', linestyle='--', linewidth=1)
                        # individual_axes.set_title(f'Average {col} \nHost: {host}')
                        individual_figures[scenario].tight_layout()
                        
                        average_scenario_dir = os.path.join(out_dir, host, scenario)
                        os.makedirs(average_scenario_dir, exist_ok=True)
                        output_path = os.path.join(average_scenario_dir, f"{col}.png")
                        individual_figures[scenario].savefig(output_path)
                        plt.close(individual_figures[scenario])
                        print(f"Saved: {output_path}")
                        


                    cons_scen_axes.set_xlabel('time from experiment start')
                    cons_scen_axes.xaxis.set_major_formatter(mticker.FuncFormatter(format_seconds_to_mm_ss))
                    cons_scen_axes.set_xlim(0, 45)
                    x1_3 = 15
                    x2_3 = 30
                    cons_scen_axes.axvline(x=x1_3, color='red', linestyle='--', linewidth=1)
                    cons_scen_axes.axvline(x=x2_3, color='blue', linestyle='--', linewidth=1)
                    # cons_scen_axes.set_title(f'Average {col} across scenarios \nHost: {host}')
                    cons_scen_axes.legend()
                    cons_scen_figure.tight_layout()
                    
                    cons_scen_host_dir = os.path.join(out_dir, "4_scenarios", host)
                    os.makedirs(cons_scen_host_dir, exist_ok=True)
                    output_path = os.path.join(cons_scen_host_dir, f"{col}.png")
                    cons_scen_figure.savefig(output_path)
                    plt.close(cons_scen_figure)
                    print(f"Saved: {output_path}")
                    
                    outfile.write(f"window 2 average value for {col}:\n")
                    values = {
                        scenario: group[col].mean() for scenario, group in filtered_df.groupby('scenario')
                    }
                    for scenario in scenarios:
                        outfile.write(f"{scenario}: {values[scenario]}\n")
                    outfile.write("\n")

                    col_average = filtered_df.groupby('scenario')[col].mean().reindex(scenarios)

                    indexes = col_average.index
                    averages = col_average.values

                    qos_axes.bar(indexes, averages, color=scenario_colors)
                    qos_axes.set_xlabel('Scenario')
                    qos_axes.set_ylabel(col)
                    # qos_axes.set_title(f'Window 2 average {col} across experiments \nHost: {host}')
                    qos_axes.grid(axis='y', linestyle='--', alpha=0.7)
                    qos_figure.tight_layout()
                    
                    output_path = os.path.join(qos_host_dir, f"{col}.png")
                    qos_figure.savefig(output_path)
                    plt.close(qos_figure)
                    print(f"Saved: {output_path}")


def main():
    # assumes sessions with same experiment params/.settings file
    parser = argparse.ArgumentParser(description="Plot Jitsi logs grouped by experiment.")
    parser.add_argument('session_names', type=str, help='Comma-separated session names (e.g., session_1,session_2)')
    parser.add_argument('hosts', type=str, help='Comma-separated host names (e.g., c0,c1,c2)')
    parser.add_argument('--output_dir', type=str, default='thesis_advanced_graphs',
                        help='Where to store generated PNGs (default: thesis_advanced_graphs)')
    parser.add_argument('--group_name', type=str, help='unique name for group of sessions being averaged')

    args = parser.parse_args()
    hosts = args.hosts.split(',')
    session_names = args.session_names.split(',')
    plot_graphs(session_names, hosts, args.output_dir, args.group_name)


if __name__ == "__main__":
    main()
