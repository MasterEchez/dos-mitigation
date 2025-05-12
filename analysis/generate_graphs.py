import os
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import argparse

def plot_graphs(session_name, hosts, output_dir):
    root_dir = "/usr/local/dos-mitigation/data"
    session_path = os.path.join(root_dir, session_name)

    if not os.path.isdir(session_path):
        print(f"Session path does not exist: {session_path}")
        return

    # Discover experiment directories
    experiments = [exp for exp in os.listdir(session_path)
                   if os.path.isdir(os.path.join(session_path, exp))]
    print(f"Discovered experiments: {experiments}")

    scenarios = ['MA', 'MB', 'UA', 'UB']

    for experiment in experiments:
        print(f"\nProcessing experiment: {experiment}")
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

                df['timestamp'] = pd.to_datetime(df['timestamp'])

                for col in df.columns:
                    if col == 'timestamp':
                        continue

                    plt.figure(figsize=(10, 6))
                    plt.plot(df['timestamp'], df[col], label=col)
                    plt.xlabel('Timestamp')
                    plt.ylabel(col)
                    plt.title(f'{col} vs Timestamp\n{host} - {scenario} - {experiment}')
                    plt.xticks(rotation=45)

                    # Format timestamps as HH:mm:ss.SSS
                    ax = plt.gca()
                    ax.xaxis.set_major_formatter(mdates.DateFormatter('%H:%M:%S.%f'))
                    plt.tight_layout()

                    # Output path
                    experiment_output = os.path.join(output_dir, session_name, experiment)
                    os.makedirs(experiment_output, exist_ok=True)
                    file_name = f"{host}_{scenario}_{col}.png"
                    output_path = os.path.join(experiment_output, file_name)

                    plt.savefig(output_path)
                    plt.close()
                    print(f"Saved: {output_path}")

def main():
    parser = argparse.ArgumentParser(description="Plot Jitsi logs grouped by experiment.")
    parser.add_argument('session_name', type=str, help='Session name (e.g., session_1)')
    parser.add_argument('hosts', type=str, help='Comma-separated host names (e.g., c0,c1,c2)')
    parser.add_argument('--output_dir', type=str, default='jitsi_graphs',
                        help='Where to store generated PNGs (default: jitsi_graphs)')

    args = parser.parse_args()
    hosts = args.hosts.split(',')
    plot_graphs(args.session_name, hosts, args.output_dir)

if __name__ == "__main__":
    main()
