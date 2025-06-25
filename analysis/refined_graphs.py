import os
import sys
import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path
import shutil
from collections import defaultdict

def add_third_lines():
    ax = plt.gca()
    xlims = ax.get_xlim()
    x1_3 = xlims[0] + (xlims[1] - xlims[0]) / 3
    x2_3 = xlims[0] + 2 * (xlims[1] - xlims[0]) / 3
    ax.axvline(x=x1_3, color='red', linestyle='--', linewidth=1)
    ax.axvline(x=x2_3, color='blue', linestyle='--', linewidth=1)

def main(session):
    data_root = Path("/usr/local/dos-mitigation/data") / session
    graphs_root = Path("./graphs") / session

    if not data_root.exists():
        print(f"Session directory not found: {data_root}")
        return

    clients = ['c0', 'c1']
    scenarios = ['UB', 'UA', 'MB', 'MA']

    # Organize data for combined plots
    data_by_subsession = defaultdict(lambda: defaultdict(lambda: defaultdict(pd.DataFrame)))

    for subsession_path in data_root.iterdir():
        if not subsession_path.is_dir():
            continue
        subsession = subsession_path.name
        output_dir = graphs_root / subsession
        output_dir.mkdir(parents=True, exist_ok=True)

        # Copy settings file
        settings_src = subsession_path / ".settings"
        if settings_src.exists():
            shutil.copy(settings_src, output_dir / ".settings")

        for client in clients:
            for scenario in scenarios:
                jitsi_path = subsession_path / client / scenario / "logs/jitsi.csv"
                if not jitsi_path.exists():
                    continue

                try:
                    df = pd.read_csv(jitsi_path)
                    df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
                    df = df.dropna(subset=['timestamp'])
                    df.sort_values('timestamp', inplace=True)
                    data_by_subsession[subsession][scenario][client] = df
                except Exception as e:
                    print(f"Failed to read {jitsi_path}: {e}")
                    continue

                # === Individual Graphs ===
                try:
                    # Bitrate plot
                    plt.figure(figsize=(10, 5))
                    plt.plot(df['timestamp'], df['bitrate_upload'], label='Upload Bitrate')
                    plt.plot(df['timestamp'], df['bitrate_download'], label='Download Bitrate')
                    plt.xlabel("Timestamp")
                    plt.ylabel("Bitrate")
                    plt.title(f"Bitrate: {client} {scenario}")
                    plt.legend()
                    # plt.tight_layout()
                    fname = f"bitrate_comparison_{client}_{scenario}.png"
                    add_third_lines()
                    plt.savefig(output_dir / fname, bbox_inches='tight')
                    plt.close()

                    # Packet loss plot
                    plt.figure(figsize=(10, 5))
                    plt.plot(df['timestamp'], df['packetloss_upload'], label='Upload Packet Loss')
                    plt.plot(df['timestamp'], df['packetloss_download'], label='Download Packet Loss')
                    plt.xlabel("Timestamp")
                    plt.ylabel("Packet Loss")
                    plt.title(f"Packet Loss: {client} {scenario}")
                    plt.legend()
                    # plt.tight_layout()
                    fname = f"packetloss_comparison_{client}_{scenario}.png"
                    add_third_lines()
                    plt.savefig(output_dir / fname, bbox_inches='tight')
                    plt.close()
                except Exception as e:
                    print(f"Failed to plot for {client}/{scenario}: {e}")

        # === Combined Client Comparisons (per Scenario) ===
        for scenario in scenarios:
            try:
                plt.figure(figsize=(10, 5))
                for client in clients:
                    df = data_by_subsession[subsession][scenario].get(client)
                    if df is not None and not df.empty:
                        plt.plot(df['timestamp'], df['bitrate_upload'], label=f'{client} Upload')
                        plt.plot(df['timestamp'], df['bitrate_download'], label=f'{client} Download')
                plt.title(f"Bitrate Comparison Between Clients - {scenario}")
                plt.xlabel("Timestamp")
                plt.ylabel("Bitrate")
                plt.legend()
                # plt.tight_layout()
                add_third_lines()
                plt.savefig(output_dir / f"bitrate_comparison_clients_{scenario}.png", bbox_inches='tight')
                plt.close()

                plt.figure(figsize=(10, 5))
                for client in clients:
                    df = data_by_subsession[subsession][scenario].get(client)
                    if df is not None and not df.empty:
                        plt.plot(df['timestamp'], df['packetloss_upload'], label=f'{client} Upload')
                        plt.plot(df['timestamp'], df['packetloss_download'], label=f'{client} Download')
                plt.title(f"Packet Loss Comparison Between Clients - {scenario}")
                plt.xlabel("Timestamp")
                plt.ylabel("Packet Loss")
                plt.legend()
                # plt.tight_layout()
                add_third_lines()
                plt.savefig(output_dir / f"packetloss_comparison_clients_{scenario}.png", bbox_inches='tight')
                plt.close()
            except Exception as e:
                print(f"Failed to create client comparison for {scenario}: {e}")

        # === Combined Scenario Comparisons (per Client) ===
        for client in clients:
            try:
                plt.figure(figsize=(10, 5))
                for scenario in scenarios:
                    df = data_by_subsession[subsession][scenario].get(client)
                    if df is not None and not df.empty:
                        plt.plot(df['timestamp'], df['bitrate_upload'], label=f'{scenario} Upload')
                        plt.plot(df['timestamp'], df['bitrate_download'], label=f'{scenario} Download')
                plt.title(f"Bitrate Comparison Between Scenarios - {client}")
                plt.xlabel("Timestamp")
                plt.ylabel("Bitrate")
                plt.legend()
                # plt.tight_layout()
                add_third_lines()
                plt.savefig(output_dir / f"bitrate_comparison_scenarios_{client}.png", bbox_inches='tight')
                plt.close()

                plt.figure(figsize=(10, 5))
                for scenario in scenarios:
                    df = data_by_subsession[subsession][scenario].get(client)
                    if df is not None and not df.empty:
                        plt.plot(df['timestamp'], df['packetloss_upload'], label=f'{scenario} Upload')
                        plt.plot(df['timestamp'], df['packetloss_download'], label=f'{scenario} Download')
                plt.title(f"Packet Loss Comparison Between Scenarios - {client}")
                plt.xlabel("Timestamp")
                plt.ylabel("Packet Loss")
                plt.legend()
                # plt.tight_layout()
                add_third_lines()
                plt.savefig(output_dir / f"packetloss_comparison_scenarios_{client}.png", bbox_inches='tight')
                plt.close()
            except Exception as e:
                print(f"Failed to create scenario comparison for {client}: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python generate_graphs.py <session>")
        sys.exit(1)

    session_arg = sys.argv[1]
    main(session_arg)
