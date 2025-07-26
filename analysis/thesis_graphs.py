import os
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import matplotlib.ticker as mticker
import argparse

def plot_graphs(session_name, hosts, output_dir, consolidate_hosts=False, consolidate_scenarios=False):
    root_dir = "/usr/local/dos-mitigation/data"
    session_path = os.path.join(root_dir, session_name)

    if not os.path.isdir(session_path):
        print(f"Session path does not exist: {session_path}")
        return

    experiments = [exp for exp in os.listdir(session_path)
                   if os.path.isdir(os.path.join(session_path, exp))]
    scenarios = ['UB', 'MB', 'UA', 'MA']
    # scenarios = ['UA']

    for experiment in experiments:
        print(f"\nProcessing experiment: {experiment}")
        # Copy .settings file
        settings_path = os.path.join(session_path, experiment, ".settings")
        if os.path.isfile(settings_path):
            experiment_output_dir = os.path.join(output_dir, session_name, experiment)
            os.makedirs(experiment_output_dir, exist_ok=True)
            destination = os.path.join(experiment_output_dir, ".settings")
            try:
                import shutil
                shutil.copy2(settings_path, destination)
                print(f"Copied settings file to: {destination}")
            except Exception as e:
                print(f"Failed to copy settings file: {e}")
        else:
            print(f"Settings file not found: {settings_path}")


        if consolidate_hosts:
            for scenario in scenarios:
                all_data = []
                for host in hosts:
                    csv_path = os.path.join(session_path, experiment, host, scenario, "logs", "jitsi.csv")
                    if not os.path.exists(csv_path):
                        continue
                    df = pd.read_csv(csv_path)
                    if 'timestamp' not in df.columns:
                        continue
                    df['timestamp'] = pd.to_datetime(df['timestamp'], unit="ms")
                    df['host'] = host
                    all_data.append(df)

                if not all_data:
                    continue

                merged_df = pd.concat(all_data)

                for col in merged_df.columns:
                    if col in ['timestamp', 'host']:
                        continue

                    plt.figure(figsize=(10, 6))
                    for host, group in merged_df.groupby('host'):
                        plt.plot(group['timestamp'], group[col], label=host)
                    plt.xlabel('time')
                    plt.ylabel(col)
                    plt.title(f'{col} across hosts\nScenario: {scenario} - Experiment: {experiment}')
                    plt.legend()
                    plt.xticks(rotation=45)
                    ax = plt.gca()
                    ax.xaxis.set_major_formatter(mdates.DateFormatter('%H:%M:%S'))

                    xlims = ax.get_xlim()
                    x1_3 = xlims[0] + (xlims[1] - xlims[0]) / 3
                    x2_3 = xlims[0] + 2 * (xlims[1] - xlims[0]) / 3
                    ax.axvline(x=x1_3, color='red', linestyle='--', linewidth=1)
                    ax.axvline(x=x2_3, color='blue', linestyle='--', linewidth=1)
                    plt.tight_layout()

                    out_dir = os.path.join(output_dir, session_name, experiment)
                    os.makedirs(out_dir, exist_ok=True)
                    output_path = os.path.join(out_dir, f"consolidated_hosts_{scenario}_{col}.png")
                    plt.savefig(output_path)
                    plt.close()
                    print(f"Saved: {output_path}")

        elif consolidate_scenarios:
            for host in hosts:
                all_data = []
                for scenario in scenarios:
                    csv_path = os.path.join(session_path, experiment, host, scenario, "logs", "jitsi.csv")
                    if not os.path.exists(csv_path):
                        continue
                    try:
                        df = pd.read_csv(csv_path)
                    except Exception as e:
                        print(f"Failed to read {csv_path}: {e}")
                        continue

                    if 'timestamp' not in df.columns:
                        print(f"Missing 'timestamp' in {csv_path}")
                        continue

                    df['timestamp'] = pd.to_datetime(df['timestamp'], unit="ms")
                    df['scenario'] = scenario
                    all_data.append(df)

                if not all_data:
                    continue

                merged_df = pd.concat(all_data)

                # Normalize time per scenario
                merged_df['relative_time'] = merged_df.groupby('scenario')['timestamp'].transform(
                    lambda x: (x - x.min()).dt.total_seconds()
                )

                # Plot each metric across scenarios
                for col in merged_df.columns:
                    if col in ['timestamp', 'relative_time', 'scenario']:
                        continue

                    plt.figure(figsize=(10, 6))
                    for scenario, group in merged_df.groupby('scenario'):
                        plt.plot(group['relative_time'], group[col], label=scenario)

                    plt.xlabel('Relative Time (seconds)')
                    plt.ylabel(col)
                    plt.title(f'{col} across scenarios (relative time)\nHost: {host} - Experiment: {experiment}')
                    plt.legend()
                    xlims = plt.xlim()
                    x1_3 = xlims[0] + (xlims[1] - xlims[0]) / 3
                    x2_3 = xlims[0] + 2 * (xlims[1] - xlims[0]) / 3
                    plt.axvline(x=x1_3, color='red', linestyle='--', linewidth=1)
                    plt.axvline(x=x2_3, color='blue', linestyle='--', linewidth=1)
                    plt.tight_layout()

                    out_dir = os.path.join(output_dir, session_name, experiment)
                    os.makedirs(out_dir, exist_ok=True)
                    output_path = os.path.join(out_dir, f"consolidated_scenarios_{host}_{col}.png")
                    plt.savefig(output_path)
                    plt.close()
                    print(f"Saved: {output_path}")
        else:
            for host in hosts:
                for scenario in scenarios:
                    csv_path = os.path.join(session_path, experiment, host, scenario, "logs", "jitsi.csv")
                    if not os.path.exists(csv_path):
                        print(f"Missing: {csv_path}")
                        continue

                    try:
                        df = pd.read_csv(csv_path)
                    except Exception as e:
                        print(f"Failed to read {csv_path}: {e}")
                        continue

                    if 'timestamp' not in df.columns:
                        print(f"Missing 'timestamp' in {csv_path}")
                        continue
                    
                    df['ms_from_start'] = df['timestamp'] - df['timestamp'].min()
                    df['timestamp_from_start'] = pd.to_datetime(df['ms_from_start'], unit="ms")
                    df['timestamp'] = pd.to_datetime(df['timestamp'], unit="ms")

                    for col in df.columns:
                        if col in ['timestamp', 'ms_from_start', 'timestamp_from_start']:
                            continue

                        plt.figure(figsize=(10, 6))
                        plt.plot(df['timestamp_from_start'], df[col], label=col)
                        plt.xlabel('time')
                        plt.ylabel(col)
                        plt.title(f'{col} vs time\n{host} - {scenario} - {experiment}')
                        plt.xticks(rotation=45)

                        ax = plt.gca()
                        ax.xaxis.set_major_formatter(mdates.DateFormatter('%M:%S'))

                        xlims = ax.get_xlim()
                        x1_3 = xlims[0] + (xlims[1] - xlims[0]) / 3
                        x2_3 = xlims[0] + 2 * (xlims[1] - xlims[0]) / 3
                        ax.axvline(x=x1_3, color='red', linestyle='--', linewidth=1)
                        ax.axvline(x=x2_3, color='blue', linestyle='--', linewidth=1)

                        plt.tight_layout()

                        experiment_output = os.path.join(output_dir, session_name, experiment, host, scenario)
                        os.makedirs(experiment_output, exist_ok=True)
                        file_name = f"{col}.png"
                        output_path = os.path.join(experiment_output, file_name)

                        plt.savefig(output_path)
                        plt.close()
                        print(f"Saved: {output_path}")

                    for (name, upload, download) in [
                        ('jitsi_bandwidth', 'jitsi_bandwidth_upload', 'jitsi_bandwidth_download'),
                        ('jitsi_bitrate', 'jitsi_bitrate_upload', 'jitsi_bitrate_download'),
                        ('rtc_framesPerSecond', 'rtc_framesPerSecond_upload', 'rtc_framesPerSecond_download')
                        ]:

                        plt.figure(figsize=(10, 6))
                        plt.plot(df['timestamp_from_start'], df[upload], label=upload)
                        plt.plot(df['timestamp_from_start'], df[download], label=download)
                        plt.xlabel('time')
                        plt.ylabel(name)
                        plt.legend()
                        plt.title(f'{name} vs time\n{host} - {scenario} - {experiment}')
                        plt.xticks(rotation=45)

                        ax = plt.gca()
                        ax.xaxis.set_major_formatter(mdates.DateFormatter('%M:%S'))

                        xlims = ax.get_xlim()
                        x1_3 = xlims[0] + (xlims[1] - xlims[0]) / 3
                        x2_3 = xlims[0] + 2 * (xlims[1] - xlims[0]) / 3
                        ax.axvline(x=x1_3, color='red', linestyle='--', linewidth=1)
                        ax.axvline(x=x2_3, color='blue', linestyle='--', linewidth=1)

                        plt.tight_layout()

                        experiment_output = os.path.join(output_dir, session_name, experiment, host, scenario)
                        os.makedirs(experiment_output, exist_ok=True)
                        file_name = f"{name}_both.png"
                        output_path = os.path.join(experiment_output, file_name)

                        plt.savefig(output_path)
                        plt.close()
                        print(f"Saved: {output_path}")

                        plt.figure(figsize=(10, 6))
                        plt.plot(df['timestamp_from_start'], df[upload] - df[download], label=f"{name}_diff")
                        plt.xlabel('time')
                        plt.ylabel(name)
                        plt.legend()
                        plt.title(f'{name} vs time\n{host} - {scenario} - {experiment}')
                        plt.xticks(rotation=45)

                        ax = plt.gca()
                        ax.xaxis.set_major_formatter(mdates.DateFormatter('%M:%S'))

                        xlims = ax.get_xlim()
                        x1_3 = xlims[0] + (xlims[1] - xlims[0]) / 3
                        x2_3 = xlims[0] + 2 * (xlims[1] - xlims[0]) / 3
                        ax.axvline(x=x1_3, color='red', linestyle='--', linewidth=1)
                        ax.axvline(x=x2_3, color='blue', linestyle='--', linewidth=1)

                        plt.tight_layout()

                        experiment_output = os.path.join(output_dir, session_name, experiment, host, scenario)
                        os.makedirs(experiment_output, exist_ok=True)
                        file_name = f"{name}_diff.png"
                        output_path = os.path.join(experiment_output, file_name)

                        plt.savefig(output_path)
                        plt.close()
                        print(f"Saved: {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Plot Jitsi logs grouped by experiment.")
    parser.add_argument('session_name', type=str, help='Session name (e.g., session_1)')
    parser.add_argument('hosts', type=str, help='Comma-separated host names (e.g., c0,c1,c2)')
    parser.add_argument('--output_dir', type=str, default='thesis_graphs',
                        help='Where to store generated PNGs (default: thesis_graphs)')
    parser.add_argument('--consolidate_hosts', action='store_true',
                        help='Plot all hosts together in one graph per scenario')
    parser.add_argument('--consolidate_scenarios', action='store_true',
                        help='Plot all scenarios together in one graph per host')

    args = parser.parse_args()
    hosts = args.hosts.split(',')
    plot_graphs(args.session_name, hosts, args.output_dir,
                consolidate_hosts=args.consolidate_hosts,
                consolidate_scenarios=args.consolidate_scenarios)


if __name__ == "__main__":
    main()
