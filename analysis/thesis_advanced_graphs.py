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

def plot_graphs(session_names, hosts, output_dir):
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

    # print(experiments_all)

    # write session names to directory
    out_dir = os.path.join(output_dir, "advanced")
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, "sessions.txt"), "w") as outfile:
        for session in session_names:
            outfile.write(f"{session}\n")

    for (i, experiments) in enumerate(zip(*experiments_all)):
        print(experiments)
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

        continue

        for host in hosts:
            all_data_dict = {
                exp: list() for exp in experiments
            }
            merged_df_dict = {}

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
                    df['scenario'] = scenario
                    all_data_dict[exp].append(df)

                if not all_data_dict[exp]:
                    "empty all_data[exp]"
                    return

                merged_df_dict[exp] = pd.concat(all_data_dict[exp])

                # Normalize time per scenario
                merged_df_dict[exp]['relative_time'] = merged_df_dict[exp].groupby('scenario')['timestamp'].transform(
                    lambda x: (x - x.min()).dt.total_seconds()
                )

                # mask = ~((df['relative_time'].dt.total_seconds() >= 15) & (df['relative_time'].dt.total_seconds() <= 30))
                merged_df_dict[exp] = merged_df_dict[exp][(merged_df_dict[exp]) >= 5]
            return

            plt.figure(figsize=(10, 6))
            # plt.xlabel('time from experiment start')
            plt.title(f'Quality of Service across scenarios \nHost: {host}')
            plt.legend()
            plt.tight_layout()
            
            out_dir = os.path.join(output_dir, "qos", host)
            os.makedirs(out_dir, exist_ok=True)
            output_path = os.path.join(out_dir, f"qos_bar_graphs.png")
            with open(os.path.join(out_dir, "sessions.txt"), "w") as outfile:
                for session in session_names:
                    outfile.write(f"session\n")
            # plt.savefig(output_path)
            plt.close()
            print(f"Saved: {output_path}")


def main():
    # assumes sessions with same experiment params/.settings file
    parser = argparse.ArgumentParser(description="Plot Jitsi logs grouped by experiment.")
    parser.add_argument('session_names', type=str, help='Comma-separated session names (e.g., session_1,session_2)')
    parser.add_argument('hosts', type=str, help='Comma-separated host names (e.g., c0,c1,c2)')
    parser.add_argument('--output_dir', type=str, default='thesis_advanced_graphs',
                        help='Where to store generated PNGs (default: thesis_advanced_graphs)')

    args = parser.parse_args()
    hosts = args.hosts.split(',')
    session_names = args.session_names.split(',')
    plot_graphs(session_names, hosts, args.output_dir)


if __name__ == "__main__":
    main()
